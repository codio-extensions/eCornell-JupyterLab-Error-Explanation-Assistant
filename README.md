## eCornell JupyterLab Error Explanation Assistant

##

This assistant mirrors the functionality of the native error explanation assistant with the following customizations:

#### Assistant button name
- Renamed the assistant button to: **Explain this Jupyter error!**
- Edit it in the `register` function call to change the button name displayed to learners.

#### Prompt modifications
- Both system and user prompts have slight changes for jupyter specific context setting.


#### Open guide pages are screened out of the context
- This can be verified by checking the `userPrompt` variable - we've **removed** the following snippet that would pass the open guide page as context

    ```
    <assignment>
    ${context.guidesPage.content}
    </assignment>
    ```

#### Passing markdown and code cell types as student file context
- comments in `index.js` walk through how we select and filter the code and markdown cell content of the open Jupyterlab notebook.
- this is then passed as context (in the `userPrompt` variable)
