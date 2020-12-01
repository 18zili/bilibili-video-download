function isBV(str) {
	return str.startsWith('BV');
}

function isNumber(obj) {
	return obj === +obj;
}

const table = [...'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'];
const s = [11, 10, 3, 8, 4, 6];
const xor = 177451812;
const add = 8728348608;

// BV转AV
function bv2av(bv) {
	let str = '';
	if (bv.length === 12) {
		str = bv;
	} else if (bv.length === 10) {
		str = `BV${bv}`;
	} else if (bv.length === 9) {
		str = `BV1${bv}`;
	} else {
		return false;
	}
	if (
		!str.match(
			/[Bb][Vv][fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF]{10}/gu
		)
	) {
		return false;
	}

	let result = 0;
	let i = 0;
	while (i < 6) {
		result += table.indexOf(str[s[i]]) * 58 ** i;
		i += 1;
	}
	return `av${(result - add) ^ xor}`;
}

// AV转BV
function av2bv(av) {
	let num = NaN;
	if (Object.prototype.toString.call(av) === '[object Number]') {
		num = av;
	} else if (Object.prototype.toString.call(av) === '[object String]') {
		num = parseInt(av.replace(/[^0-9]/gu, ''));
	}
	if (isNaN(num) || num <= 0) {
		return false;
	}

	num = (num ^ xor) + add;
	let result = [...'bv1  4 1 7  '];
	let i = 0;
	while (i < 6) {
		result[s[i]] = table[Math.floor(num / 58 ** i) % 58];
		i += 1;
	}
	return result.join('');
}

function bytesToSize(bytes) {
	if (bytes === 0) return '0 B';

	var k = 1024;

	sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

module.exports = {
	isBV,
	isNumber,
	bv2av,
	av2bv,
	bytesToSize,
};
