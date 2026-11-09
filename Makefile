.PHONY: run test model python browser screenshots clean

run:
	python3 server.py --open

model:
	node tests/model_test.mjs

python:
	python3 -m unittest discover -s tests -p 'test_*.py' -v

test: model python

browser:
	python3 tests/browser_smoke.py

screenshots:
	python3 tests/browser_smoke.py

clean:
	rm -rf tests/artifacts __pycache__ **/__pycache__
