## eCornell JupyterLab Error Explanation Assistant

##

This assistant mirrors the functionality of the native error explanation assistant with the following customizations:

#### 1. Open guide pages are screened out of the context
- This can be verified by checking the userPrompt variable - we've **removed** the following snippet that would pass the open guide page as context

    ```
    <assignment>
    ${context.guidesPage.content}
    </assignment>
    ```

#### 2. Passing markdown and code cell types as student file context
- 