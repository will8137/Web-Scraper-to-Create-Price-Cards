const fs = require('fs-extra');
const Path = require('path')
const Util = require('util');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const ReadFile = Util.promisify(fs.readFile);
const chalk = require('chalk');
const figlet = require('figlet');

async function getFinance(page) {

	//The magical Function that gets the fucking finance options!!! (Its Dynamic so its a bitch to get)
  const financeOptionsArray = await page.$$eval('h3.ng-binding', h3s => [].map.call(h3s, h3 => h3.innerHTML));

  let financeOptionsObjectsArray = [];

  //Insert code to return finance options as objects in array
	for (let i = 0; i < financeOptionsArray.length; i++) {

			if ( i && (i % 3 === 0) || i === 0) {

				let financeObject = {
					optionLength: financeOptionsArray[i],
					optionAPR: financeOptionsArray[i+1],
					optionAmount: financeOptionsArray[i+2]
				}

				financeOptionsObjectsArray.push(financeObject);

			} else { 
				continue; 
			}
	    
	}
  //Return the array
  return financeOptionsObjectsArray;

};

async function getProductName(page) {

	//Gets the product name
  const productNameElement = await page.$$eval('h1.product-main-title', productName => [].map.call(productName, name => name.innerHTML));

  //Convert Array to String
  const productNameElementString = productNameElement[0].toString();

  //Return the array
  return productNameElementString;

};

async function getProductPrice(page) {

	//Gets the product name
  const productPriceElement = await page.$$eval('span.gak-price', productPrice => [].map.call(productPrice, price => price.innerHTML));

  /*//Remove Currency Symbol
  const productPriceElementString = productPriceElement[0].substring(1);*/

  //Remove Currency Symbol More efficient
  const productPriceElementInt = Math.ceil(parseFloat(productPriceElement[0].replace(/\£|,/g, '')));

  //Return the array
  return productPriceElementInt;

};

async function createJsonFile(products) {

	console.log(chalk.yellowBright('Creating products.json'));

	// Write all products to Json File
	try {
		await fs.writeFile('./products.json', JSON.stringify(products, null, 2) , 'utf-8').then(data => {
			console.log(chalk.green('File Created!', '\n'));
		});
	} catch(err) {
		console.log(chalk.red("error" + error));
    	throw error;
	}

};

async function readJsonFile() {

	console.log(chalk.yellowBright('Reading products.json'));

	try {
		//Read json file with array of products
    const productsJson = await fs.readJson('./products.json');

    //Probably fires before actual load
    console.log(chalk.green('Products Loaded!', '\n'));

    //Return Product Array
    return productsJson;

  } catch (err) {
    console.error(err)
  }

};

async function createPriceCard(productList) {

	try {
		console.log(chalk.yellowBright('Starting PDF Generation'));
		
		const templatePath = Path.resolve('./Assets/htmlFinanceCard/FinancePriceCardTemplatePro.html');

		const content = await ReadFile(templatePath, 'utf8');

		// compile and render the template with handlebars
	  const template = Handlebars.compile(content);

	  return template();

	} catch (error) {
	  throw new Error('Cannot create invoice HTML template.', error);
	}

};

async function pdfGenerator(html) {

  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.setContent(html)

  console.log(chalk.green('PDF Generated!', '\n'));

  return page.pdf();
}

async function savePDF(pdfData) {

	console.log(chalk.yellowBright('Saving PDF'));

	try {
		await fs.writeFile('./Assets/pdf/priceCard.pdf', pdfData, 'binary').then(data => {
			console.log(chalk.green('PDF Saved!'));
		});
	} catch(err) {
		console.log(chalk.red("error" + error));
    	throw error;
	}

};

//Main Run Function
(async () => {

	console.log(figlet.textSync('Price Checker', {
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default'
	}));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36');

  //Urls of products we want to get info of
  var urls = ['https://www.gak.co.uk/en/ssl-xlogic-alpha-vhd-pre/22222', 'https://www.gak.co.uk/en/ssl-xlogic-alpha-channel/6512', 'https://www.gak.co.uk/en/black-lion-audio-b12a-mkii-500-series-mic-pre-/916803'];
  
  //Array of product info from website ready to be written to json file
  var productDatabase = [];

  //Loading bar progress counter
  let urlCounter;

  //Loop over each url and push to database array
  for(var i=0; i<urls.length; i++){

  	//Add int to urlCounter for display purposes(UI Sorta thing)
  	urlCounter = i+1;
  	console.log(chalk.yellowBright('Getting Product: ' + urlCounter + ' out of ' + urls.length));

  	//Await page load of url from array
  	await page.goto(urls[i]);

		//Get Product Name
		let product = await getProductName(page);

		//Get Product Price
		let price = await getProductPrice(page);

		//Get Product Finance
		let finance = await getFinance(page);

		//Push products to database var
		productDatabase.push({
			productName: product,
			productPrice: price,
			productFinanceOptions: finance
		});

		if(i === urls.length-1){
			console.log(chalk.green('Product fetch complete!', '\n'));
		} else {
			continue;
		};

  };

  console.log(chalk.yellowBright('Closing browser'));

  //Close browser
  await browser.close().then(data => {
  	console.log(chalk.green('Browser Closed', '\n'));
  })

  //Create and save Json file to current directory under name (products.json)
  await createJsonFile(productDatabase);

  //Get Products from json file
  const productList = await readJsonFile();

  //Create price card. Maybe add for loop here when working
  var priceCard = await createPriceCard(productList);

  //Generate PDF
  var pdfPriceCard = await pdfGenerator(priceCard);

  //Save PDF to (Assets/pdf)
  await savePDF(pdfPriceCard);

  //Stop App
  process.exit(0);

})();