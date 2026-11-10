.PHONY: run test model python browser screenshots desktop-dev desktop-dist clean

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

desktop-dev:
	cd desktop && npm start

desktop-dist:
	cd desktop && npm run dist

clean:
	rm -rf tests/artifacts __pycache__ **/__pycache__
