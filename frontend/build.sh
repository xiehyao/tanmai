#!/bin/bash
# uni-app构建脚本
# 设置环境变量后执行构建

export UNI_PLATFORM=h5
export UNI_INPUT_DIR=.
export UNI_OUTPUT_DIR=dist/h5

cd /var/www/html/moodle/tanmai/frontend
npm run build
