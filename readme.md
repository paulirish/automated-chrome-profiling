Let's say you want to evaluate the performance of some JavaScript and want to automate it as much as possible. Let's do that!

We want to use the [Chrome debugging protocol](https://developer.chrome.com/devtools/docs/debugger-protocol) and go directly to [how Chrome's JS sampling profiler interacts with V8](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/protocol.json&q=protocol.json%20%22domain%22:%20%22Profiler%22&sq=package:chromium&type=cs).

But we'll use [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface) as a nice client in front of it:

    npm install chrome-remote-interface

Run Chrome with an open debugging port:

    # linux
    google-chrome --remote-debugging-port=9222

    # mac
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222


## Let's profile!

We're about to…

* Open http://localhost:8080/perf-test.html
* Start profiling
* run `startTest();`
* Stop profiling and retrieve the profiling result
* Load the data into Chrome DevTools
![](http://i.imgur.com/zAZa3iU.jpg)

#### Code
```js
var fs = require('fs');
var Chrome = require('chrome-remote-interface');

Chrome(function (chrome) {
    with (chrome) {
        Page.enable();
        Page.loadEventFired(function () {
            Runtime.evaluate({ "expression": "console.profile(); startTest(); console.profileEnd();" });
        });
        Profiler.enable();
        Profiler.consoleProfileFinished(function (params) {
            // CPUProfile object described here:
            //    https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/protocol.json&q=protocol.json%20%22CPUProfile%22,&sq=package:chromium

            // Either:
            // 1. process the data in node or...
            // 2. save as JSON to disk, open Chrome DevTools, Profiles tab,
            //    select CPU Profile radio button, click `load` and view the
            //    profile data in the full devtools UI.
            var file = 'profile-' + Date.now() + '.cpuprofile';
            var data = JSON.stringify(params.profile, null, 2);
            fs.writeFileSync(file, data);
            console.log('Done! See ' + file);
            close();
        });
        // 100 microsecond sampling resolution, (1000 is default)
        Profiler.setSamplingInterval({ 'interval': 100 }, function () {
            Page.navigate({'url': 'http://localhost:8080/perf-test.html'});
        });
    }
}).on('error', function () {
    console.error('Cannot connect to Chrome');
});
```

For asynchronous tests, the code would be:

```js
Runtime.evaluate({ "expression": "console.profile(); startTest(function() { console.profileEnd(); });" });

// ...

function startTest(cb) {
    foo.on('end', cb);
    foo.startAsync();
}
```

#### Enjoy!

 Please file issues or PR any updates as you try things.

#### Why?

Testing the performance of asynchronous code is difficult. Obviously measuring endTime - startTime doesn't work. Using a profiler gives you the insight of how many microseconds the CPU spent within each script, function and its children. For async usecases, in particular, you can now evaluate differences much easier.

### Contributors
* paul irish
* [@vladikoff](http://github.com/vladikoff)
* [Andrea Cardaci](https://github.com/cyrus-and)
