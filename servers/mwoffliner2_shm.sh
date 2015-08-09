#!/bin/sh

ZIM2INDEX=/srv/upload/zim2index/
SCRIPT=`readlink -f $0/../`
SCRIPT_DIR=`dirname "$SCRIPT"`
MWOFFLINER="$SCRIPT_DIR/mwoffliner.js"
MWMATRIXOFFLINER="$SCRIPT_DIR/mwmatrixoffliner.js --verbose --speed=3 --skipHtmlCache --deflateTmpHtml --adminEmail=contact@kiwix.org --mwUrl=http://meta.wikimedia.org/ --parsoidUrl=http://rest.wikimedia.org/ --cacheDirectory=/data/scratch/mwoffliner/cac/ --tmpDirectory=/dev/shm/ --skipCacheCleaning"

# Wikipedia
$MWMATRIXOFFLINER --project=wiki --outputDirectory=$ZIM2INDEX/wikipedia/ --language="(ar|bg|cs|da|et|el|eo|eu|fi|gl|he|hy|hi|hr|id|kk|lt|la|ms|min|nn|no|ro|simple|sk|sl|sr|sh|uk|uz|tr|vo)"