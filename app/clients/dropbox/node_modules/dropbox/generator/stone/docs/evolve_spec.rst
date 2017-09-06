***************
Evolving a Spec
***************

APIs are constantly evolving. In designing Stone, we sought to codify what
changes are backwards incompatible, and added facilities to make maintaining
compatibility easier.

Background
==========

The root of the problem is that when an API interface evolves, it does not
evolve simultaneously for all communicating parties. This happens for a couple
reasons:

    1. The owner of the API does not have control over 3rd parties that have
       integrated their software at some point in the evolution of the
       interface. These integrations may never be updated making
       compatibility-awareness critical.
    2. Even the owner of the API may roll out evolutions to their fleet of
       servers in stages, meaning that clusters of servers will have different
       understandings of the interface for windows of time.

Sender-Recipient
================

When discussing interface compatibility, it's best to think in terms of a
message sender and a message receiver, either of which may have a newer
interface.

If the sender has a newer version, we want to make sure that the recipient
still understands the message it receives, and ignores the parts that it
doesn't.

If the recipient has a newer version, we want to make sure that it knows what
to do when the sender's message is missing data.

Backwards Incompatible Changes
------------------------------

    * Removing a struct field
        * An old receiver may have application-layer dependencies on the field,
          which will cease to exist.
    * Changing the type of a struct field.
        * An old receiver may have application-layer dependencies on the field
          type. In statically typed languages deserialization will fail.
    * Adding a new tag to a union without a `catch-all tag <lang_ref.rst#union-catch-all>`_.
        * We expect receivers to exhaustively handle all tags. If a new tag is
          returned, the receiver's handler code will be insufficient.
    * Changing the type of a tag with a non-Void type.
        * Similar to the above, if a tag changes, the old receiver's
          handler code will break.
    * Changing any of the types of a route description to an incompatible one.
        * When changing an arg, result, or error data type for a route, you
          should think about it as applying a series of operations to convert
          the old data type to the new one.
        * The change in data type is backwards incompatible if any operation
          is backwards incompatible.

Backwards Compatible Changes
----------------------------

    * Adding a new route.
    * Changing the name of a stuct, union, or alias.
    * Adding a field to a struct that is optional or has a default.
        * If the receiver is newer, it will either set the field to the
          default, or mark the field as unset, which is acceptable since the
          field is optional.
        * If the sender is newer, it will send the new field. The receiver will
          simply ignore the field that it does not understand.
    * Change the type of a tag from Void to anything else.
        * The older receiver will ignore information associated with the new
          data type and continue to present a tag with no value to the
          application.
    * Adding another tag to a union that has a catch-all specified.
        * The older receiver will not understand the incoming tag, and will
          simply set the union to its catch-all tag. The application-layer will
          handle this new tag through the same code path that handles the
          catch-all tag.

Planning for Backwards Compatibility
====================================

    * When defining a union that you're likely to add tags to in the
      future, add a `catch-all tag <lang_ref.rst#union-catch-all>`_.

Leader-Clients
==============

We focused on senders and recipients because they illustrate the general case
where any two parties may have different versions of a spec. However, your
system may have an added layer of predictability where some party ("leader") is
guaranteed to have the same or newer version of the spec than its "clients."

It's important to note that a leader-clients relationship can be transient and
opportunistic--it's important to decide if this relationship exists in your
setup.

The leader-client relationship comes up often:

    1. A service that has an API is the "leader" for first-party or third-party
       clients in the wild that are accessing the service's data. The server
       will get a spec update, and clients will have to update their code to
       take advantage of the new spec.
    2. Within a fleet of servers, you may have two clusters that communicate
       with each other, one of which receives scheduled updates before the
       other.

A known leader can be stricter with what it receives from clients:

    * When the leader is acting as a recipient, it should reject any struct
      fields it is unaware of. It knows that the unknown fields are not because
      the client, acting as a sender, has a newer version of the spec.

        * Since a client acting as a recipient may have an older spec, it
          should retain the behavior of ignoring unknown fields.

    * If the leader is acting as a recipient, it should reject all unknown
      tags even if the union specifies a catch-all.
    * If the leader is acting as a recipient, any tag with type Void should
      have no associated value in the serialized message since it's not
      possible for a client to have converted the data type to something else.

[TODO] There are more nuanced backwards compatible changes such as: A tag
can be removed if the union is only sent from the server to a client. Will this
level of detail just lead to errors in practice?

Route Versioning
================

Building language facilities to ease route versioning has yet to be addressed.
Right now, if you know you are making a backwards incompatible change, we
suggest the following verbose approach:

    * Create a new route.
        * We recommend simply attaching a numerical suffix to prevent a name
          collision. For example, ``/get_account`` becomes ``/get_account2``.
    * Copy the definition of any data types that are changing in a backwards
      incompatible way. For example, if the response data type is undergoing an
      incompatible change, duplicate the response data type, give it a new
      name, and make the necessary modifications.
    * Be sure to update the route signature to reference the new data type.

Future Work
===========

Building in a lint checker into the ``stone`` command-line interface that
warns if a spec change is backwards incompatible based on the revision history.
This assumes that the spec file is in a version-tracking system like git or hg.
