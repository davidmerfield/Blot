****************
Network Protocol
****************

While Stone does not standardize the network protocol used to send messages
between hosts, we do anticipate that HTTP will be a popular medium. This
document describes how serialized Stone objects can be transmitted using
HTTP based on experiences from implementing the Dropbox v2 API.

Remote Procedure Calls
======================

The majority of the routes in the Dropbox API are expected to be used by
non-browser clients. Clients tend to be one of the several SDKs that Dropbox
maintains for popular programming languages.

Because of this, it was convenient to use the body of the HTTP request and
response to store JSON-serialized Stone objects. Both requests and responses
set the ``Content-Type`` header to ``application/json``.

Based on the ``get_account`` route defined in the running example in the `Language
Reference <lang_ref.rst>`_, the following is a sample exchange between a client
and server.

An example request::

    POST /users/get_account
    Content-Type: application/json

    {
       "account_id": "id-48sa2f0"
    }

An example sucessful response::

    200 OK
    Content-Type: application/json

    {
        "account_id": "id-48sa2f0",
        "email": "alex@example.org",
        "name": "Alexander the Great"
    }

An example error response::

    409 Conflict
    Content-Type: application/json

    {
        "reason": "no_account",
    }

HTTP Endpoint
    The ``get_account`` route defined in the ``users`` namespace was mapped to
    the url ``/users/get_account``. No host information is shown intentionally.

HTTP Status Code
    A response indicates that its body contains an object conforming to a
    route's error data type by returning an HTTP 409 error code. It was
    important to use a "protocol layer" feature to indicate if an error had
    occurred.

Authentication
    There is no authentication scheme shown in the above example. One
    possibility is to use an ``Authorization`` header.

Browser Compatibility
=====================

[TODO] Encoding JSON in headers for upload and download-style routes.
