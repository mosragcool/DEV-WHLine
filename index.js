const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
let mainSFToken = null;


const port = process.env.PORT || 1234
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())




app.post('/webhook', (req, res) => {

console.log('Start');

    let events = req.body.events[0];
    Process(events);
    res.sendStatus(200)
});
app.listen(port)


async function Process(events) {
    var SF_Token = null;
    var statusCode = null;

    if (mainSFToken == null) {
        mainSFToken = await GetTokenSF();
        SF_Token = mainSFToken;
    }
    else
    {
        SF_Token = mainSFToken;
    }  

    if (SF_Token != null) {
        console.log('Token.affinityToken : ' + SF_Token.affinityToken + 'Token.key : ' + SF_Token.key);
        statusCode = await ConnectAgent(SF_Token);
    }
    console.log('statusCode : '+statusCode);
    while (statusCode != '200') {

        mainSFToken = await GetTokenSF();
        SF_Token = mainSFToken;
        statusCode = await ConnectAgent(SF_Token);

    }


    PutMessage_SF(SF_Token,events.message.text);

    let statusChatEnd = false;

    while (!statusChatEnd) {
        let respon = await GetResponAgent(SF_Token);
 
        respon.forEach(item => {
            
            console.log(item.type);
            
            if (item.type == 'ChatRequestFail' || item.type == 'ChatEnded')
            {
                statusChatEnd = true;
                mainSFToken = null;
if(item.type == 'ChatRequestFail')
{
    ReplyMessage_Line(events, 'agent offline');
}

            } 
            if (item.type == 'ChatMessage') {
                let responMessage = item.message.text;
                ReplyMessage_Line(events, responMessage);
            }

        });



        

      

            /*
let respon = '';

while(respon !=  respon != 'ChatEstablished')
{
    respon =  await GetResponAgent(SF_Token);
}
*/

            

    

    

            

    }
}

function GetTokenSF() {
    return new Promise(function(resolve, reject) {

        try {
            var UrlGenSession = 'https://d.la1-c1cs-ukb.salesforceliveagent.com/chat/rest/System/SessionId';
            let headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-LIVEAGENT-API-VERSION': 34,
                'X-LIVEAGENT-AFFINITY': null
            }
            /* let body = JSON.stringify({
                 replyToken: reply_token,
                 messages: [{
                     type: 'text',
                     text: msg
                 }]
             })*/
            request.get({
                url: UrlGenSession,
                headers: headers,
                body: ''
            }, (err, res, body) => {

                if (res.statusCode == "200") {
                    return resolve(JSON.parse(res.body));
                }

            });

        } catch (express) {
            console.log(express);
        }

    });
}

function ConnectAgent(SF_Token) {
    return new Promise(function(resolve, reject) {




        var urlStart = 'https://d.la1-c1cs-ukb.salesforceliveagent.com/chat/rest/Chasitor/ChasitorInit';
        let headers_Start = {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': 34,
            'X-LIVEAGENT-AFFINITY': SF_Token.affinityToken,
            'X-LIVEAGENT-SESSION-KEY': SF_Token.key,
            'X-LIVEAGENT-SEQUENCE': 1

        } 
        let body_Start = JSON.stringify({
            sessionId: SF_Token.id,
            organizationId: "00Dp0000000DHzd",
            buttonId: "573p00000008OhU",
            deploymentId: "572p00000008OZz",
            userAgent: "",
            language: "en-US",
            screenResolution: "1920x1080",
            visitorName: "Mossss", //+ Date.now(),
            prechatDetails: [],
            prechatEntities: [],
            receiveQueueUpdates: true,
            isPost: true
        });


        request.post({
            url: urlStart,
            headers: headers_Start,
            body: body_Start
        }, (err, res, body) => {


                return resolve(res.statusCode);
         
            

        });

    });
}

function GetResponAgent(SF_Token) {
    return new Promise(function(resolve, reject) {

        try {
            var UrlGenSession = 'https://d.la1-c1cs-ukb.salesforceliveagent.com/chat/rest/System/Messages';
            let headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-LIVEAGENT-API-VERSION': 34,
                'X-LIVEAGENT-AFFINITY': SF_Token.affinityToken,
                'X-LIVEAGENT-SESSION-KEY': SF_Token.key,
            }
            /* let body = JSON.stringify({
                 replyToken: reply_token,
                 messages: [{
                     type: 'text',
                     text: msg
                 }]
             })*/
            request.get({
                url: UrlGenSession,
                headers: headers,
                body: ''
            }, (err, res, body) => {

                if (res.statusCode == "200") {
                    var value = JSON.parse(res.body);
                    //   console.log(value.messages[0].type);
                    // console.log(value.messages[1]);
                    return resolve(value.messages);
                }

            });

        } catch (express) {
            console.log(express);
        }

    });
}

function PutMessage_SF(SF_Token, Message) {
    return new Promise(function(resolve, reject) {




        var urlStart = 'https://d.la1-c1cs-ukb.salesforceliveagent.com/chat/rest/Chasitor/ChatMessage';
        let headers_Start = {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': 34,
            'X-LIVEAGENT-AFFINITY': SF_Token.affinityToken,
            'X-LIVEAGENT-SESSION-KEY': SF_Token.key

        }
        let body_Start = JSON.stringify({
            sessionId: SF_Token.id,
            text: Message
        });


        request.post({
            url: urlStart,
            headers: headers_Start,
            body: body_Start
        }, (err, res, body) => {


            if (res.statusCode == '200') {


                return resolve('200');
            }

        });

    });
}

function ReplyMessage_Line(events, msg) {

    let sHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {5YnGXybKgNMHV4N+K1nDhJIVXy6Q16pryvDbGLtPwidfqLlM5TpfQcyCHQc+4VrYx0fSLjJyXSC/ks4UGY+cKBcYWJYuHBxe0MF34tNprsp6lg34obDoLdnI82IqRigsbm8XU0Oz7asvLfpja+V09wdB04t89/1O/w1cDnyilFU=}'
    }
    let sBody = JSON.stringify({
        to: events.source.userId,
        messages: [{
            type: 'text',
            text: msg
        }]
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/push',
        headers: sHeaders,
        body: sBody
    }, (err, res, body) => {
    
        if(res.statusCode == '400')
        {
            console.log('Error = ' + res.body);
        }
    });
}




