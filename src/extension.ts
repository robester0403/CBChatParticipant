import * as vscode from 'vscode';
import { apiClient } from './utils/api';
// import { PlayPrompt } from './play';
// import { renderPrompt } from '@vscode/prompt-tsx';

const CHAT_EXAMPLE = 'cb-example.chat';
const TEST_BUTTON_COMMAND_ID = 'test.button';

interface ChatResults extends vscode.ChatResult {
    metadata: {
        command: string;
    }
}

// stream tech req responses
// some kind of progress indication return
// validation of args for specific commands
// rework the api code. Fetch-node is not directly supported so using axios.
// typescript config
// Better UX
const MODEL_SELECTOR: vscode.LanguageModelChatSelector = { vendor: 'copilot', family: 'gpt-4' };

export function activate(context: vscode.ExtensionContext) {
    // Define a chat handler. 
    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<ChatResults> => {
        // --- Begin of custom CB Commands ---
        console.log(request.command)
        if (request.command == 'getprd') {
            stream.progress('Retrieving CB Info')
            try {
                const response = await apiClient.get({endpoint: "v1/prd/12117/phase"});
                const data = response?.data;
                stream.markdown(data);
                console.log(data[0].categories) // the master data array is here. 
                data[0].categories.forEach((category: any) => {
                    stream.markdown("**Title: " + category.title + "**\n\n\n")
                    category.features.forEach((feature: any) => {
                        stream.markdown(`Feature (id: ${feature.id}):  + ${feature.title}`)
                        stream.button({
                            command: "injectsomecommandtocli",
                            title: 'Recommend a tech stack',
                            arguments: [{ id: feature.id }]
                        })
                    })
                })
            } catch (err) {
                console.error(err)
                stream.markdown("There was an error getting the PRD")
            }

            return { metadata: { command: 'getprd' } };
        }

        if (request.command == 'generateTechReqs') {
            stream.progress('Sending Request')
            try {
                await apiClient.post({endpoint: `v1/prd/12117/feature/${request.prompt}/request-tech-recommendation`});
                stream.markdown("Tech Recommendations are being Generated");
            } catch (err) {
                console.error(err)
                stream.markdown("There was an error generating the tech recommendations")
            }

            return { metadata: { command: 'generateTechReqs' } };
        }

        if (request.command == 'getTechReqs') {
            stream.progress('Sending Request')
            try {
                const response = await apiClient.get({endpoint: `v1/prd/12117/feature/${request.prompt}/tech-recommendations`});
                console.log(response?.data)
                stream.markdown("Tech Rec response is in the console for now");
            } catch (err) {
                console.error(err)
                stream.markdown("There was an error getting the tech recommendations")
            }

            return { metadata: { command: 'getTechReqs' } };
        }

        // we can also send this starter prompt to the backend to generate the code if needed. This is just an example of using the LLM
        // Currently set to copy and paste a req into the chat.
        if (request.command == 'codeTechReq') {
            try {
                const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
                if (model) {
                    const messages = [
                        vscode.LanguageModelChatMessage.Assistant(`You are a world class software engineer. Take a deep breath and think through the task you are given step by step. You are to take the prompt and return code that will meet the requirements.`),
                        vscode.LanguageModelChatMessage.User(request.prompt)
                    ];
    
                    const chatResponse = await model.sendRequest(messages, {}, token);
                    for await (const fragment of chatResponse.text) {
                        stream.markdown(fragment);
                    }
                }
            } catch (err) {
                handleError(err, stream);
            }
    
            return { metadata: { command: 'codeTechReq' } };
        }
        // --- End of custom CB Commands ---

        try {
            const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
            if (model) {
                const messages = [
                    vscode.LanguageModelChatMessage.Assistant(`You are a world class software engineer. Take a deep breath and think through the task you are given step by step. You are to take the prompt and return code that will meet the requirements.`),
                    vscode.LanguageModelChatMessage.User(request.prompt)
                ];

                const chatResponse = await model.sendRequest(messages, {}, token);
                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            }
        } catch (err) {
            handleError(err, stream);
        }

        return { metadata: { command: '' } };
    };

    const CbAI = vscode.chat.createChatParticipant(CHAT_EXAMPLE, handler);
    CbAI.iconPath = vscode.Uri.joinPath(context.extensionUri, 'crowdbotics.jpg');

    // below is for registering a command.
    // to do we have to figure out how to access the active text editor before it works.
    context.subscriptions.push(
        CbAI,
        // Register the command handler for the test button command
        vscode.commands.registerCommand(TEST_BUTTON_COMMAND_ID, async (args: any) => {

            //run workspace with some args
            const textEditor = vscode.window.activeTextEditor ;
            vscode.window.showInformationMessage('Testing this.');

            if (textEditor) {

                await textEditor.edit(edit => {
                    const lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
                    const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
                    edit.insert(position, `\n\n This is a test with id ${args.id}`);
                });
            }
        }),
    )
}

function handleError(err: any, stream: vscode.ChatResponseStream): void {
    if (err instanceof vscode.LanguageModelError) {
        console.log(err.message, err.code, err.cause);
        if (err.cause instanceof Error && err.cause.message.includes('off_topic')) {
            stream.markdown(vscode.l10n.t('I\'m sorry, I can only explain computer science concepts.'));
        }
    } else {
        throw err;
    }
}

export function deactivate() { }
