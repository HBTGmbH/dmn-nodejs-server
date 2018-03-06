[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# About

dmn-server is a standalone NodeJS server to manage and execute [DMN](http://www.omg.org/spec/DMN/1.1/) decision tables.
It provides a REST interface to manage decision tables, and a JSON-RPC (over HTTP) interface to execute decisions.

If you are looking for a DMN engine to embed in your (Browser or NodeJS) Javascript code, have a look at [dmn-eval-js](https://www.npmjs.com/package/@hbtgmbh/dmn-eval-js) instead.
Actually, that library is used under the hood of dmn-server. Refer to its documentation on information which elements of DMN decision tables are supported. 

# Usage

## Installation

```
npm install -g @hbtgmbh/dmn-server
```

## Start the server

Example call:
```
node dmn-server 8080 8081 /usr/share/dmn-server/data
```

In this example,
- '8080' is the port for HTTP REST calls to manage decisions (create, read, update, delete)
- '8081' is the port for HTTP JSON-RPC calls to execute decisions
- '/usr/share/dmn-server/data' is the path to where the server persists the managed DMN files internally

## Manage decision tables

dmn-server supports different versions of decisions, but only the most recent version may be executed. It is however possible to rollback
to the previous version if a new version proved errorneous.

### Supported operations ###
 
#### Add a decision
 
```POST /decisions/approveLoan``` 

This creates version 1 of the decision named 'approveLoan' (without quotes). The request body must contain
the valid DMN definitions as XML data. The definitions content must contain a decision with a decision id
that matches the name in the URL (here: 'approveLoan'). 
Example:

```
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" id="some_definitions_id" name="definitions">
  <decision id="approveLoan" name="Approve Loan Decision">
    ... 
  </decision>
</definitions>  
```

The HTTP status codes of the response:
- 201 if the decision was successfully created. The Location header field contains the URL to GET the created decision.
- 400 if the content is not valid DMN XML. It may also be the case the the content
*is* valid DMN XML, but contains a DMN1.1 FEEL expression which is not supported by dmn-server. The degree of FEEL support is described here: [dmn-eval-js](https://www.npmjs.com/package/@hbtgmbh/dmn-eval-js)
- 409 if the content is valid DMN XML, but does not contain the expected decision.
 
#### Add a new version of a decision 

```POST /decisions/approveLoan``` 

Actually, the call is the same as if the decision was newly added. If a decision already exists, a new version is created
from the DMN XML content of the decision. That version will from now on be used to execute decisions.
  
#### Rollback to the previous version of a decision

```DELETE /decisions/approveLoan``` 

Does *not* delete the decision named 'approveLoan' altogether but deletes the most recent version of it. The previous version will from now on be used to execute decisions.
No content is expected as request body. Note: the version number of the deleted version will be re-used when a new version of the
decision is created: version numbers are always consecutive, and there is no history/archive of deleted versions.  

The HTTP status code of the response is 404 if no decision with the requested name is found.
It is 200 if the version was successfully deleted.
 
#### Delete a decision

```DELETE /decisions/approveLoan``` 

Actually, the call is the same as for deleting the most recent version of the decision. This means that a decision
cannot be deleted at once, instead, all its versions will have to be deleted one-by-one.

#### Read the definition of a decision in its latest version

```GET /decisions/approveLoan```

Returns a JSON object which includes, among other data, the DMN representation of latest version of the decision named 'approveLoad' in XML notation. Example:
```
{
    decisionName: 'approveLoan'
    latestVersionNumber: 3,
    latestVersion: '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...'
};
```

The HTTP status code of the response is 404 if the decision with the requested name is not found.

#### Read the definition of a decision in a specific version

```GET /decisions/approveLoan/versions/2```

Returns a JSON object which includes, among other data, the DMN representation of version 2 of the decision named 'approveLoad' in XML notation. Example:
```
{
    decisionName: 'approveLoan'
    latestVersionNumber: 3,
    requestedVersionNumber: 2,
    requestedVersion: '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...'
};
```

The HTTP status code of the response is 404 if no decision with the requested name is found, or if it is found but the requested version does not exist
(these two cases cannot be distinguished from the status code of the response).

#### Read the definitions of all versions of a decision

```GET /decisions/approveLoan/versions```

Returns a JSON object which includes, among other data, an array with the DMN representation of each version of the decision named 'approveLoad' in XML notation. Example:
```
{
    decisionName: 'approveLoan'
    latestVersionNumber: 3,
    versions: [
        '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...',
        '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...',
        '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...',
    ]
};
```

The HTTP status code of the response is 404 if the decision with the requested name is not found.

#### Read the definitions of all decisions in their latest version

```GET /decisions```

Returns a JSON array, which contains for each decision its latest version. Example:

```
[{
    decisionName: 'approveLoan'
    latestVersionNumber: 3,
    latestVersion: '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...',
 },{
    decisionName: 'determineRisk'
    latestVersionNumber: 2,
    latestVersion: '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns=...',
}];
```

## Execute decision tables

dmn-server does not allow support managing decisions, but also to execute them using [dmn-eval-js](https://www.npmjs.com/package/@hbtgmbh/dmn-eval-js) under the hood.

Since an execution of a decision is not considered a resource, but rather an operation, there is no REST API for decision execution.
Instead, JSON RPC is the standard of choice. Decisions are executed by calling HTTP POST with a JSON RPC v2 conformable request body. Example:

```
{ 
	"jsonrpc": "2.0", 
	"method": "executeDecision", 
	"params": { 
		"decisionName": "approveLoan", 
		"context": {
		    ...
		}
	},
	"id": 1
}
``` 

In the above example, the decision 'approvalLoan' is executed, using the supplied context as input.
Example of a successful response:

``` 
{
    "jsonrpc": "2.0",
    "result": {
        "loanApproved": true
    },
    "id": 1
}
```

If the execution failed, the server responds with an error of type Server error (code -32000) according to JSON RPC.
The 'errorDetails' field contains a textual representation of the error cause. Example for an attempt to execute an unknown decision:

```
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32000,
        "message": "Server error",
        "data": {
            "decisionName": "approveLoan",
            "errorDetails": "Decision was not found."
        }
    },
    "id": 1
}
```

## Security

Currently, the server supports HTTP only. HTTPS might be supported in future versions of dmn-server.

Also, there is currently no support for any kind of access control. A future version might implement token-based authentication.   

# Reference

A description of the degree of DMN support in the decision tables that can be maintained and executed by dmn-server
can be found here: 

[dmn-eval-js](https://www.npmjs.com/package/@hbtgmbh/dmn-eval-js)
 
For comprehensive set of documentation on DMN in general, you can refer to :

[DMN Specification Document](http://www.omg.org/spec/DMN/1.1/)
