#!/bin/bash

ALLPASS=0;

cd actualZips

for f in *; do
	PASS=0
	FILE=$f

	if [ ${#FILE} -eq 0 ]
	then
		echo "No game zip files found"
	fi

	echo ${FILE##*/}

	unzip -q -d ../workingDirectory ${FILE##*/}

	cd ../expected

	EXPFILE=$(find . -type d -name "${FILE##*/}")
	if [ ${#EXPFILE} -eq 0 ]
	then
		echo "Expected file ".${FILE##*/}."not found"
	else
		cd ${FILE##*/}
	fi

	if ! diff -b ../../workingDirectory/js/constants.js constants.js; then
		PASS=1
		ALLPASS=1
		echo "FAIL: constants.js"
	fi

	if ! diff -b ../../workingDirectory/css/style.css style.css; then
		PASS=1
		ALLPASS=1
		echo "FAIL: style.css"
	fi

	if ! diff -b -q ../../workingDirectory/index.html index.html; then
        	PASS=1
		ALLPASS=1
        	echo "FAIL: index.html"
	fi

	if ! diff -b ../../workingDirectory/app.js app.js; then
	        PASS=1
		ALLPASS=1
	        echo "FAIL: app.js"
	fi

	cd ../../workingDirectory/cardFiles
	for c in *; do
		CARD=$c
		if [ ${#CARD} -eq 0 ]
		then
			PASS=1
			ALLPASS=1
			echo "FAIL: card File Not found"
		else
			if ! diff -b -q ${CARD##*/} ../../expected/${EXPFILE##*/};  then
				PASS=1
				ALLPASS=1
				echo "FAIL: cardFile name"
			fi
		fi
	done

	cd ../..
	rm -r workingDirectory/*
	cd actualZips

	if [ $PASS -eq 0 ]
	then
		printf "Pass\n\n"
	else
		printf "FAIL\n\n"
	fi
done

cd ..
rm -r workingDirectory

if [ $ALLPASS -eq 0 ]
then
	echo "All Pass"
else
	echo "Some Tests Failed"
fi
