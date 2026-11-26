// Playfair cipher with the usual textbook rules: a 5x5 key square in which
// I and J share a cell, and text handled in pairs of letters. Used by
// playfair.html; tests/ciphers.test.js loads it with Node.

var PLAYFAIR_ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";	// 25 letters, no J

// upper-case letters only, with J written as I; everything else is dropped
function playfairLetters(text) {
	return text.toUpperCase().replace(/[^A-Z]/g, "").replace(/J/g, "I");
}

// the key square: the key's letters (each only once), then the rest of the alphabet
function playfairSquare(key) {
	var letters = playfairLetters(key) + PLAYFAIR_ALPHABET;
	var used = "";
	for (var i = 0; i < letters.length; i++) {
		if (used.indexOf(letters[i]) === -1)
			used += letters[i];
	}
	var square = [];
	for (var row = 0; row < 5; row++)
		square.push(used.slice(row * 5, row * 5 + 5).split(""));
	return square;
}

// the filler that goes after a letter: X, or Q if the letter is itself X
function playfairFiller(letter) {
	return letter === "X" ? "Q" : "X";
}

// split plaintext into pairs: a pair of equal letters is split by a filler,
// and a single letter left over at the end gets a filler too
function playfairPairs(text) {
	var letters = playfairLetters(text);
	var pairs = [];
	var i = 0;
	while (i < letters.length) {
		var first = letters[i];
		var second = letters[i + 1];
		if (second === undefined || second === first) {
			pairs.push(first + playfairFiller(first));
			i += 1;
		} else {
			pairs.push(first + second);
			i += 2;
		}
	}
	return pairs;
}

// row and column of a letter in the square
function playfairFind(square, letter) {
	for (var row = 0; row < 5; row++) {
		var col = square[row].indexOf(letter);
		if (col !== -1)
			return { row: row, col: col };
	}
	throw new Error("Letter " + letter + " is not in the key square");
}

// encrypt one pair with step 1 (right / down); decrypt with step 4 (left / up)
function playfairPair(square, pair, step) {
	var a = playfairFind(square, pair[0]);
	var b = playfairFind(square, pair[1]);
	if (a.row === b.row)		// same row: the letters to the right
		return square[a.row][(a.col + step) % 5] + square[b.row][(b.col + step) % 5];
	if (a.col === b.col)		// same column: the letters below
		return square[(a.row + step) % 5][a.col] + square[(b.row + step) % 5][b.col];
	// rectangle: same row, the other letter's column
	return square[a.row][b.col] + square[b.row][a.col];
}

function playfairEncrypt(text, key) {
	var square = playfairSquare(key);
	var pairs = playfairPairs(text);
	if (pairs.length === 0)
		throw new Error("Type some text to encrypt (letters A to Z).");
	var result = pairs.map(function (pair) { return playfairPair(square, pair, 1); });
	return { square: square, pairs: pairs, result: result };
}

function playfairDecrypt(text, key) {
	var square = playfairSquare(key);
	var letters = playfairLetters(text);
	if (letters.length === 0)
		throw new Error("Type the ciphertext to decrypt (letters A to Z).");
	if (letters.length % 2 !== 0)
		throw new Error("Playfair ciphertext has an even number of letters, but this has " + letters.length + ".");
	var pairs = letters.match(/../g);
	for (var i = 0; i < pairs.length; i++) {
		if (pairs[i][0] === pairs[i][1])
			throw new Error("The pair " + pairs[i] + " cannot occur in Playfair ciphertext: the two letters of a pair always differ.");
	}
	var result = pairs.map(function (pair) { return playfairPair(square, pair, 4); });
	return { square: square, pairs: pairs, result: result,
		withoutFillers: playfairRemoveFillers(result.join("")) };
}

// best guess at the original text: drop each X (Q after an X) that is the
// second letter of a pair and sits between two equal letters or at the very
// end, which is where encryption adds fillers. A real X in those places is
// dropped too, so this is only a guess.
function playfairRemoveFillers(text) {
	var out = "";
	for (var i = 0; i < text.length; i++) {
		var before = text[i - 1];
		var after = text[i + 1];
		var isFiller = i % 2 === 1 && text[i] === playfairFiller(before) &&
			(after === before || after === undefined);
		if (!isFiller)
			out += text[i];
	}
	return out;
}

// draw the key square on the page
function showSquare() {
	var square = playfairSquare(document.getElementById("key").value);
	var html = "";
	for (var row = 0; row < 5; row++) {
		html += "<tr>";
		for (var col = 0; col < 5; col++)
			html += "<td>" + (square[row][col] === "I" ? "I/J" : square[row][col]) + "</td>";
		html += "</tr>";
	}
	document.getElementById("square").innerHTML = html;
}

// handler for the page's Encrypt / Decrypt buttons
function doPlayfair(isDecrypt) {
	var key = document.getElementById("key").value;
	var text = document.getElementById("text").value;
	var message = document.getElementById("message");
	var output = document.getElementById("output");
	var r;

	showSquare();
	try {
		r = isDecrypt ? playfairDecrypt(text, key) : playfairEncrypt(text, key);
	} catch (e) {
		message.textContent = e.message;
		message.className = "error";
		message.hidden = false;
		output.hidden = true;
		return;
	}

	message.hidden = true;
	output.hidden = false;
	document.getElementById("pairs-label").textContent = isDecrypt ? "Ciphertext pairs" : "Plaintext pairs";
	document.getElementById("pairs").textContent = r.pairs.join(" ");
	document.getElementById("result-label").textContent = isDecrypt ? "Plaintext, filler letters included" : "Ciphertext";
	document.getElementById("result").textContent = r.result.join(" ");
	document.getElementById("guess-label").hidden = !isDecrypt;
	document.getElementById("guess").hidden = !isDecrypt;
	document.getElementById("guess").textContent = isDecrypt ? r.withoutFillers : "";
}

// Lets the tests in tests/ load this file with Node; browsers skip it.
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		playfairSquare: playfairSquare,
		playfairPairs: playfairPairs,
		playfairPair: playfairPair,
		playfairEncrypt: playfairEncrypt,
		playfairDecrypt: playfairDecrypt,
		playfairRemoveFillers: playfairRemoveFillers
	};
}
