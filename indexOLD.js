const puppeteer = require('puppeteer');

(async () => {
	try {
		const browser = await puppeteer.launch({ headless: true });
		const page = await browser.newPage();

		page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36');

		await page.goto('https://www.gak.co.uk/en/ableton-push-2-ableton-live-controller/124186');

		await page.waitForSelector('.nav-tabs');

		const financeTable = await page.$$('.nav-tabs');

		for (const finance of financeTable) {
			const financeTab = await finance.$('a#finance-tab');
			financeTab.click();

			console.log('Finance Tab Clicked');

			await page.waitForSelector('.finance-table');
			await page.waitForSelector('.finance-row-success');
			const financeInfo = await page.$$('.ng-binding');

			console.log(financeInfo);

			for (const financeOption of financeInfo) {
				const financeOptionText = await financeOption.$eval('.ng-binding', h3 => h3.innerHTML);
				console.log('Test: ', financeOptionText);
			}
		}

		//await browser.close();

	} catch(e) {
		console.log('our error', e);
	}
})();