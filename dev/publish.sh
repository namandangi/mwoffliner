# This should only be run by Travis
if [ -n "$CI" ]; then
    if [ -n "$TRAVIS_TAG" ]; then
        echo "Found tag [$TRAVIS_TAG], releasing"
        if [[ $TRAVIS_TAG == *"-rc"* ]]; then
            echo "This is an rc release"
            npm publish --tag rc
        else
            echo "This is a production release"
            npm publish
        fi
    else
        if [ "$TRAVIS_BRANCH" == "master" ]; then
            echo "No tag found, releasing dev"
            node dev/hackPackageVersion.js
            npm publish --tag dev
        else
            echo "Not on master, so not releasing dev"
        fi
    fi
else
    echo "dev/publish.sh should only be executed by Travis"
fi