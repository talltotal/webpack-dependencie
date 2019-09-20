#!/bin/bash
if [[ -z $1 ]]; then
  echo "Enter new version: "
  read -r VERSION
else
  VERSION=$1
fi

# -p 提示语句
# -n 读取指定字符字数
# -r 行末的/字段本来用于换行，在这里也认为是一个字符
# 在最后指定变量，不指定时，会存在环境变量REPLY中
read -p "Releasing $VERSION - are you sure? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run compile
  npm version $VERSION
  node ./script/prePublish.js

  cd ./packages/webpack
  npm run publish
  cd ../vscode
  vsce package
  vsce publish
  cd ../
fi
