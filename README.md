logitag
=======
The logitag web service collects context information. Using service
discovery it automatically receives apps from a nearby appool service,
evaluates the rules for every app, deploys apps to the devices and
optionally activates them. 


Logitag can be installed with npm:

    git clone https://github.com/tequnix/logitag
    cd logitag
    npm install

HTTP Method | Path | Return type | Action
------------|------|-------------|--------
POST        | /tags/upload | 204, no content | Expects a JSON object with url and tag array property. 
GET         |  /clients | JSON | Returns information of known devices that have sent context information to logitag.  
