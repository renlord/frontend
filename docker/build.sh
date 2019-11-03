#!/bin/sh

IMAGE_NAME=owntracks-frontend
RELTAG=latest

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

echo "building for arm64v8, arm32v7 and amd64"
docker build --no-cache -f ${SCRIPTPATH}/Dockerfile.arm64v8 . -t pocoyo/$IMAGE_NAME:arm64v8 && \
docker push pocoyo/$IMAGE_NAME:arm64v8
docker build --no-cache -f ${SCRIPTPATH}/Dockerfile.arm32v7 . -t pocoyo/$IMAGE_NAME:arm32v7 && \
docker push pocoyo/$IMAGE_NAME:arm32v7

docker manifest create pocoyo/$IMAGE_NAME:$RELTAG \
    pocoyo/$IMAGE_NAME:arm64v8 \
    pocoyo/$IMAGE_NAME:arm32v7 && \

docker manifest annotate pocoyo/$IMAGE_NAME:$RELTAG\
    pocoyo/$IMAGE_NAME:arm32v7 \
    --arch arm \
    --os linux

docker manifest annotate pocoyo/$IMAGE_NAME:$RELTAG \
    pocoyo/$IMAGE_NAME:arm64v8 \
    --arch arm64 \
    --os linux

docker manifest push --purge pocoyo/$IMAGE_NAME:$RELTAG
