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

parser.add_argument('--nsamples', type=int, default=0, help='Number of samples to generate')
parser.add_argument('--output', type=str, default='output.json', help='Output file')
parser.add_argument('--run_name', type=str, default='run1', help='Run id. Name of subdirectory in checkpoint/ and samples/')


global _nsamples_
global _output_
global _run_name_
_nsamples_ = parser.parse_args().nsamples
_output_ = parser.parse_args().output
_run_name_ = parser.parse_args().run_name

CHECKPOINT_DIR = 'checkpoint'

def sample_model(
    model_name='124M',
    seed=None,
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

        _output = []

        if os.path.isfile(_output_):
            with open(_output_, 'r') as f:
                _output = json.load(f)

        generated = 0
        while _nsamples_ == 0 or generated < _nsamples_:
            out = sess.run(output)
            for i in range(batch_size):
                generated += batch_size

                text = enc.decode(out[i])                
                text = " ".join(text.split('\n'))

                print("=" * 20 + "\n" + text + "\n" + "=" * 20)

                _output.append(text)

            with open(_output_, 'w') as f:
                json.dump(_output, f, indent=4)

if __name__ == '__main__':
    fire.Fire(sample_model)
