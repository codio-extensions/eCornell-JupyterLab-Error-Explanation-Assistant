// Wrapping the whole extension in a JS function 
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {

    codioIDE.onErrorState((isError, error) => {
        console.log('codioIDE.onErrorState', {isError, error})
        if (isError) {
        codioIDE.coachBot.showTooltip("I can help explain this error...", () => {
            codioIDE.coachBot.open({id: "errorExpWithFixes", params: "tooltip"})
        })
        }
    })

    // register(id: unique button id, name: name of button visible in Coach, function: function to call when button is clicked) 
    codioIDE.coachBot.register("customErrorExplanationJupyter", "Explain this Jupyter error!", onButtonPress)

    // function called when I have a question button is pressed
    async function onButtonPress(params) {

        // automatically collects all available context 
        let context = await codioIDE.coachBot.getContext()
        // console.log(context)
        
        // select open jupyterlab notebook related context
        let openJupyterFileContext = context.jupyterContext[0]
        let jupyterFileName = openJupyterFileContext.path
        let jupyterFileContent = openJupyterFileContext.content
        
        // filter and map cell indices of code and markdown cells into a new array
        const markdownAndCodeCells = jupyterFileContent.map(
            ({ id, ...rest }, index) => ({
                 cell: index,
                ...rest
            })).filter(
                obj => obj.type === 'markdown' || obj.type === 'code'
            )
        // console.log("code and markdown", JSON.stringify(markdownAndCodeCells))

        let input

        if (params == "tooltip") { 
            // input the error message caught from error state automatically and show it in chat
            input = context.error.text
            codioIDE.coachBot.write(context.error.text, codioIDE.coachBot.MESSAGE_ROLES.USER)
        } else {
            try {
                // ask for error message to be pasted as input
                input = await codioIDE.coachBot.input("Please paste the error message you want me to explain!")
            } catch (e) {
                // catches the error/action when nothing is pasted or if the back to menu button is clicked
                if (e.message == "Cancelled") 
                codioIDE.coachBot.write("Please feel free to have any other error messages explained!")
                codioIDE.coachBot.showMenu()
                return
            }
        }

        // validation prompt to ensure pasted text is actually an error message
        const valPrompt = `<Instructions>

Please determine whether the following text appears to be a programming error message or not:

<text>
${input}
</text>

Output your final Yes or No answer in JSON format with the key 'answer'

Focus on looking for key indicators that suggest the text is an error message, such as:

- Words like "error", "exception", "stack trace", "traceback", etc.
- Line numbers, file names, or function/method names
- Language that sounds like it is reporting a problem or issue
- Language that sounds like it is providing feedback
- Technical jargon related to coding/programming

If you don't see clear signs that it is an error message, assume it is not. Only answer "Yes" if you are quite confident it is an error message. 
If it is not a traditional error message, only answer "Yes" if it sounds like it is providing feedback as part of an automated grading system.

</Instructions>`
    
        const validation_result = await codioIDE.coachBot.ask({
            systemPrompt: "You are a helpful assistant.",
            userPrompt: valPrompt
        }, {stream:false, preventMenu: true})

        // if validation result is yes, pass pasted text to error explanation API call with all context
        if (validation_result.result.includes("Yes")) {
        
            // Define your assistant's prompts here
            // this is where you will provide the role definition, examples and the context you collected,
            // along with the task you want the LLM to generate text for.
            
            const systemPrompt = `You will be given a programming error message. Your task is to explain in plain, non-technical English what is causing the error, without suggesting any potential fixes or solutions.
If provided with the student's jupyter notebook, please carefully review it before explaining the error message.
Note that information about common misconceptions should also be included to provide a full explanation.
When referring to code in your explanation, please use markdown syntax. Wrap inline code with \` and multiline code with \`\`\`. 
  `
        
            const userPrompt = `Here is the error message:
<error_message>
${input}
</error_message>

Here is the student's jupyter notebook:

<code>
${JSON.stringify(markdownAndCodeCells)}
</code> 

If <code> is empty, assume that it's not available. 

Phrase your explanation directly addressing the student as 'you'. 
After writing your explanation in 2-3 sentences, double check that it does not suggest any fixes or solutions. 
The explanation should only describe the cause of the error.`

            const result = await codioIDE.coachBot.ask({
                systemPrompt: systemPrompt,
                messages: [{"role": "user", "content": userPrompt}]
            })
        }
        else {
            codioIDE.coachBot.write("This doesn't look like an error. I'm sorry, I can only help you by explaining programming error messages.")
            codioIDE.coachBot.showMenu()
        }
    }

})(window.codioIDE, window)
