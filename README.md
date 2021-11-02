## License

[Modified MIT](./LICENSE)

## commands i use

```bash
# in dataset folder
deno run -A download_messages.js
deno run -A join_datasets.js

# in root folder
python3 download_model.py 124M
python3 src/train.py --dataset dataset.npz --save_every 50 --sample_every 100 --sample_num 3
python3 src/encode.py ./dataset/dataset.txt dataset.npz --model_name 124M
```