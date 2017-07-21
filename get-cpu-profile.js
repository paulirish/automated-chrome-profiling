const fs = require('fs');
const cdp = require('chrome-remote-interface');
const chromelauncher = require('chrome-launcher');

const sleep = n => new Promise(resolve => setTimeout(resolve, n));

const url = 'http://localhost:8080/demo/perf-test.html';

(async function() {
  const chrome = await chromelauncher.launch({port: 9222});
  const client = await cdp();

  const {Profiler, Page, Runtime} = client;
  // enable domains to get events.
  await Page.enable();
  await Profiler.enable();

  // Set JS profiler sampling resolution to 100 microsecond (default is 1000)
  await Profiler.setSamplingInterval({interval: 100});

  await Page.navigate({url});
  await client.on('Page.loadEventFired', async _ => {
    // on load we'll start profiling, kick off the test, and finish
    await Profiler.start();
    await Runtime.evaluate({expression: 'startTest();'});
    await sleep(600);
    const data = await Profiler.stop();
    saveProfile(data);
  });

  async function saveProfile(data) {
    // data.profile described here: https://chromedevtools.github.io/devtools-protocol/tot/Profiler/#type-Profile
    // Process the data however you wish… or,
    // Use the JSON file, open Chrome DevTools, Menu, More Tools, JavaScript Profiler, `load`, view in the UI
    const filename = `profile-${Date.now()}.cpuprofile`;
    const string = JSON.stringify(data.profile, null, 2);
    fs.writeFileSync(filename, string);
    console.log('Done! Profile data saved to:', filename);

    await client.close();
    await chrome.kill();
  }
})();
