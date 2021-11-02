from requests import get as requestget
from requests import post as requestpost

import fire
import json
import os
import numpy as np
import tensorflow.compat.v1 as tf
from time import sleep

import model, sample, encoder

import argparse

parser = argparse.ArgumentParser(
    description='Let the model send discord messages!',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument('--token', type=str, help='The token to use for the bot', required=True)
parser.add_argument('--channel', type=str, default="813399092368769025", help='The channel to send the message to')
parser.add_argument('--run_name', type=str, default='run1', help='Run id. Name of subdirectory in checkpoint/ and samples/')
parser.add_argument('--self_bot', action='store_true', help='Send the message using a normal discord account')

global _token_
global _channel_
global _run_name_
global _self_bot_
_token_ = parser.parse_args().token
_channel_ = parser.parse_args().channel
_run_name_ = parser.parse_args().run_name
_self_bot_ = parser.parse_args().self_bot

CHECKPOINT_DIR = 'checkpoint'

def send_bot_message(token, channel, body):
    body = body.replace('#', '%23')
    body = body.replace('@', '%40')
    body = body.replace('&', '%26')
    body = body.replace('?', '%3F')
    body = body.replace('=', '%3D')
    body = body.replace('+', '%2B')
    body = body.replace(' ', '%20')
    body = body.replace('\n', '%0A')

    response = requestget(f"https://x.glowman554.gq/api/message?token={token}&channel={channel}&body={body.replace('#', '%23')}")

    if response.text.strip() != "Message sent":
        print(response.text)
        raise Exception("Failed to send message")

def send_self_bot_message(token, channel, body):
    while True:
        response = requestpost(f"https://discord.com/api/v9/channels/{channel}/messages", json={"content": body}, headers={"Authorization": token})
        if response.status_code != 200:
            print(response.text)
            reason = json.loads(response.text)
            if reason['code'] == 20028:
                print("Rate limited, waiting " + str(reason['retry_after']) + " seconds")
                sleep(reason["retry_after"])
            else:
                raise Exception("Failed to send message")
        else:
            break

def sample_model(
    model_name='124M',
    seed=None,
    nsamples=0,
    batch_size=1,
    length=100,
    temperature=1,
    top_k=0,
    top_p=1,
    models_dir='models',
):
    models_dir = os.path.expanduser(os.path.expandvars(models_dir))
    enc = encoder.get_encoder(model_name, models_dir)
    hparams = model.default_hparams()
    with open(os.path.join(models_dir, model_name, 'hparams.json')) as f:
        hparams.override_from_dict(json.load(f))

    if length is None:
        length = hparams.n_ctx
    elif length > hparams.n_ctx:
        raise ValueError("Can't get samples longer than window size: %s" % hparams.n_ctx)

    with tf.Session(graph=tf.Graph()) as sess:
        np.random.seed(seed)
        tf.set_random_seed(seed)

        output = sample.sample_sequence(
            hparams=hparams, length=length,
            start_token=enc.encoder['<|endoftext|>'],
            batch_size=batch_size,
            temperature=temperature, top_k=top_k, top_p=top_p
        )[:, 1:]

        saver = tf.train.Saver()
        ckpt = tf.train.latest_checkpoint(os.path.join(CHECKPOINT_DIR, _run_name_))
        if ckpt is None:
            # Get fresh GPT weights if new run.
            ckpt = tf.train.latest_checkpoint(os.path.join('models', model_name))

        saver.restore(sess, ckpt)

        generated = 0
        while nsamples == 0 or generated < nsamples:
            out = sess.run(output)
            for i in range(batch_size):
                generated += batch_size

                text = enc.decode(out[i])                
                text = " ".join(text.split('\n'))

                print("Sent message to discord: " + text)
                try:
                    if _self_bot_:
                        send_self_bot_message(_token_, _channel_, text)
                    else:
                        send_bot_message(_token_, _channel_, text)
                except Exception as e:
                    print(e)


if __name__ == '__main__':
    fire.Fire(sample_model)
