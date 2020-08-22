// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

const TIMERS_PERMISSION = 'alexa::alerts::timers:skill:readwrite';

const main = require('./documents/session.json');

function getAnnouncementTimer(handlerInput, duration) {
    return {
        duration: duration,
        label: "My announcement Timer",
        creationBehavior: {
            displayExperience: {
                visibility: 'VISIBLE'
            }
        },
        triggeringBehavior: {
            operation: {
                type: 'ANNOUNCE',
                textToAnnounce: [{
                    locale: 'en-US',
                    text: 'That was your timer'
                }]
            },
            notificationConfig: {
                playAudible: false
            }
        }
    };
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can say Hello or Help. Which would you like to try?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const SendEventIntentHandler = {
  canHandle(handlerInput) {
    // Check for SendEvent sent from the button
    return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
  },
  handle(handlerInput) {
    // Take argument sent from the button to speak back to the user
    console.log('Soure id ' + handlerInput.requestEnvelope.request.source.id)
    const speechText = "An event has been triggered";
    return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse()
  }
};
const StartSessionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartSessionIntent';
    },
    async handle(handlerInput) {

        const { serviceClientFactory } = handlerInput;
        const timer = getAnnouncementTimer(handlerInput, 'PT25M');

        console.log('About to create timer: ' + JSON.stringify(timer));

        try {
            const timerServiceClient = serviceClientFactory.getTimerManagementServiceClient();
            const timersList = await timerServiceClient.getTimers();
            console.log('Current timers: ' + JSON.stringify(timersList));

            //const timerResponse = await timerServiceClient.createTimer(timer);
            //console.log('Timer creation response: ' + JSON.stringify(timerResponse));

            //const timerId = timerResponse.id;
            //const timerStatus = timerResponse.status;
            const timerStatus = 'ON';
            if (timerStatus === 'ON') {
                const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
                sessionAttributes['startedText'] = "Wow, it is started";
                //sessionAttributes['lastTimerId'] = timerId;

                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                const speakOutput = 'Focus session starts from now.';
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .addDirective({
                        type: 'Alexa.Presentation.APL.RenderDocument',
                        token: "sessionToken",
                        document: main,
                        datasources: {}
                    })
                    .addDirective({
                        type: 'Alexa.Presentation.APL.ExecuteCommands',
                        token: 'sessionToken',
                        commands: [
                            {
                                type: "Sequential",
                                commands: [
                                    {
                                        type: "Idle",
                                        delay: "60000"
                                    },
                                    {
                                        type: "Idle",
                                        delay: "80000"
                                    },
                                    {
                                        type: "SendEvent",
                                        arguments: [
                                          "timeout clicked the button"
                                        ]
                                    }
                                ]
                            }
                        ]
                    })
                    //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
                    .getResponse();
            } else {
                throw { statusCode: 308, message: 'Timer did not start' };
            }
        } catch (error) {
            if (error.statusCode === 401) {
                console.log('Unauthorized!');
                // we send a request to enable by voice
                // note that you'll need another handler to process the result, see AskForResponseHandler
                return handlerInput.responseBuilder
                    .addDirective({
                        type: 'Connections.SendRequest',
                        'name': 'AskFor',
                        'payload': {
                            '@type': 'AskForPermissionsConsentRequest',
                            '@version': '1',
                            'permissionScope': TIMERS_PERMISSION
                        },
                        token: 'verifier'
                    }).getResponse();
            }
            else {
                return handlerInput.responseBuilder
                    .speak('Unable to create timer. What would you do next?')
                    .reprompt('What would you do next')
                    .getResponse();
            }
        }



        // const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // sessionAttributes.startedText = "Wow, it is started";

        // handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        // const speakOutput = 'Hello World! Start! I saved this attributes ${sessionAttributes.startedText}';
        // return handlerInput.responseBuilder
        //     .speak(speakOutput)
        //     //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        //     .getResponse();
    }
};
const StopSessionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StopSessionIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const speakOutput = 'Hello World Stop! ${sessionAttributes.startedText}';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
const PauseSessionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PauseSessionIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World Pause!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StartSessionIntentHandler,
        SendEventIntentHandler,
        StopSessionIntentHandler,
        PauseSessionIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
