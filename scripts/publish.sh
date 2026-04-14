#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "==> Cleaning build artifacts..."
rm -rf build dist src/*.egg-info

echo "==> Building distribution packages..."
python -m build

echo "==> Built packages:"
ls -lh dist/

echo ""
echo "==> To publish to PyPI, run:"
echo "   python -m twine upload dist/*"
echo ""
echo "==> To publish to TestPyPI first, run:"
echo "   python -m twine upload --repository testpypi dist/*"
