# Contributing to Dropbox JavaScript SDK

## How to contribute

### Improve documentation

Typo corrections, error fixes, better explanations, more examples, etc are
all extremely helpful and will be much appreciated.

### Improve issues

Some issues are created missing information, missing reproduction steps,
a result of other third party code or are just invalid. Helping to clean
up issues saves a lot of time and leads to things getting fixed faster.

### Write code

Bug fixes, code improvements and better tests are always welcome. Please
see the steps below to get up and running. Please open an issue if you are
considering opening a pull request for new functionality.

> Note that `/src/routes.js` is a generated file and cannot be updated by
> changes to this repository

#### Development environment

You will need [Node.js](https://nodejs.org/en/) and
[npm](https://www.npmjs.com/) installed on your machine. Run the following
commands to setup a local development environment:

```console
$ git clone https://github.com/dropbox/dropbox-sdk-js && cd $_
$ npm install && npm start
```

The development/examples server is now live at <http://0.0.0.0:8080/>.

You can now make changes to `src/` files and they will be recompiled and
used by the development/examples server.

#### Tests
The following command runs the test suite:
```console
$ npm test
```

## Submitting an issue
- Search the issue tracker before opening an issue.
- Ensure you're using the latest version.
- Use a clear and descriptive title.
- Include as much information as possible: Steps to reproduce the issue,
  error message, Node.js version, operating system, etc.
- The more time you put into an issue, the more we will.
- The best issue report is a failing test proving it.

## Submitting a pull request
- Non-trivial changes are often best discussed in an issue first, to
  prevent you from doing unnecessary work.
- New features should be accompanied with tests and documentation.
- Don't include unrelated changes.
- Lint and test before submitting the pull request by running `$ npm test`.
- Make the pull request from a topic branch, not master.
- Use a clear and descriptive title for the pull request and commits.
- Write a convincing description of why we should land your pull request.
  It's your job to convince us. Answer "why" it's needed and provide
  use-cases.
- You might be asked to do changes to your pull request. There's never
  a need to open another pull request. Just update the existing one.
