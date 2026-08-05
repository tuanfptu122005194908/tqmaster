import json

with open(r'output\Đề_Thi_FE_-_SSA101_-_SU26_-_FE_raw.json', encoding='utf-8') as f:
    data = json.load(f)

for q in data[:5]:
    sf = q.get('_source_file', '?')
    question = q.get('question', '')[:80]
    opts = q.get('options', {})
    print(f"=== {sf} ===")
    print(f"Q: {question}")
    for k in sorted(opts.keys()):
        print(f"  {k}. {opts[k]}")
    print()
