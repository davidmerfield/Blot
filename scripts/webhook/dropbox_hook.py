#!/usr/bin/python

import argparse
from hashlib import sha256
import hmac
import json
import sys

import click
import requests

@click.group()
def cli():
    '''This tool makes it easier to test Dropbox webhooks, particularly on localhost. It generates fake requests, mimicking what Dropbox itself sends. Usage:

    \b
        dropbox_hook.py verify URL
        dropbox_hook.py notify URL -s APP_SECRET -u USER_ID

    For detailed help, try this:

        dropbox_hook.py COMMAND --help
    '''
    pass

@cli.command()
@click.argument('url', metavar='URL', required=True)
@click.option('--challenge', '-c', help='The challenge string to send in a verification request (defaults to "challenge123").', default='challenge123', metavar='CHALLENGE', required=True)
def verify(url, challenge):
    '''Send a verification request. Example usage:

    dropbox_hook.py verify http://www.example.com
    '''

    response = requests.get(url, params={ 'challenge': challenge })
    if response.status_code == 200:
        if response.text == challenge:
            print 'Verification passed!'
        else:
            text = response.text
            if len(text) > 30:
                text = '(truncated) "%s..."' % text[:30]
            else:
                text = '"%s"' % text
            print 'Invalid verification response. Expected "%s", but server responded with %s' % (challenge, text)
    else:
        print 'Invalid verification response. Server responded with status code %d.' % response.status_code

@cli.command()
@click.argument('url', metavar='URL', required=True)
@click.option('--secret', '-s', help='Your app secret', metavar='APP_SECRET', required=True)
@click.option('--user', '-u', help='The user IDs to send to the webhook URI (may be specified multiple times).', multiple=True, metavar='USER_ID', required=True, type=int)
def notify(url, secret, user):
    '''Send a notification request. Example usage:

    dropbox_hook.py notify http://www.example.com --secret ABC123 --user 12345
    '''

    body = json.dumps({ 'delta': { 'users': user } })

    response = requests.post(
        url,
        data=body,
        headers={
            'X-Dropbox-Signature': hmac.new(str(secret), body, sha256).hexdigest()
        })
    if response.status_code == 200:
        print 'Webhook invoked successfully.'
    else:
        print 'Invalid webhook response. Server responded with status code %d.' % response.status_code
        sys.exit(1)

if __name__=='__main__':
    cli()
