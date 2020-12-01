const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const axios = require('axios');
const request = require('request');
const md5 = require('md5');
const { isBV, bv2av } = require('./utils');

const Progress = require('./progress');

const promptList = [
	{
		type: 'input',
		name: 'aid',
		message: '请输入视频链接地址:',
	},
	{
		type: 'list',
		name: 'quality',
		message: '请选择下载清晰度:',
		choices: ['1080P', '720P', '480P', '360P'],
	},
	{
		type: 'list',
		name: 'format',
		message: '请选择视频格式',
		choices: ['MP4', 'flv'],
	},
];

const qualityMap = {
	'1080P': 80,
	'720P': 64,
	'480P': 32,
	'360P': 16,
};

async function start() {
	let { aid, quality, format } = await inquirer.prompt(promptList);
	aid = aid.substr(31, 12);
	quality = qualityMap[quality];

	isBV(aid) && (aid = bv2av(aid).substr(2));

	let startUrl = 'https://api.bilibili.com/x/web-interface/view?aid=' + aid;
	let headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
	};
	const res = await axios.get(startUrl, { headers });
	const { pages } = res.data.data;

	for (let i = 0; i < pages.length; i++) {
		let { cid, part, page } = pages[i];
		startUrl += '/?p=' + page;
		const list = await getPlayList(startUrl, cid, 80);
		await download(list, part, startUrl, page, format);
	}
}

async function getPlayList(startUrl, cid, quality) {
	const appkey = 'iVGUTjsxvpLeuDCf',
		sec = 'aHRmhWMLkdeMuILqORnYZocwMBpMEOdt';
	const params = `appkey=${appkey}&cid=${cid}&otype=json&qn=${quality}&quality=${quality}&type=`;
	const chksum = md5(params + sec);
	const api = `https://interface.bilibili.com/v2/playurl?${params}&sign=${chksum}`;
	const headers = {
		Referer: startUrl,
		'User-Agent':
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
	};
	const res = await axios.get(api, { headers });
	const durl = res.data.durl;
	return durl;
}

async function download(list, title, startUrl, page, format) {
	const dir = path.join(__dirname, 'downloads');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	for (let i = 0; i < list.length; i++) {
		const { size: total, url } = list[i];
		const headers = {
			// Host: 'upos-hz-mirrorks3.acgvideo.com', // 注意修改host,不用也行
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0',
			Accept: '*/*',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			Range: 'bytes=0-', // Range 的值要为 bytes=0- 才能下载完整视频
			Referer: startUrl, // 注意修改referer,必须要加的!
			Origin: 'https://www.bilibili.com',
			Connection: 'keep-alive',
		};

		return new Promise((resolve) => {
			const ProgressBar = new Progress('正在下载：' + title);
			const downloadPath = path.join(dir, title + '.' + format);
			const out = fs.createWriteStream(downloadPath);
			const req = request({ url, headers });
			req.pipe(out);
			var completed = 0;
			req.on('data', (data) => {
				completed += data.length;
				ProgressBar.render({
					completed,
					total,
				});
			});
			req.on('close', () => {
				console.log(title + '下载完毕');
				resolve();
			});
		});
	}
}

start();
