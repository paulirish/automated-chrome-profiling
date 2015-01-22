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
        Page.navigate({'url': 'http://localhost:8080/perf-test.html'}, function(){
            Runtime.enable();
            Profiler.enable();
            Profiler.setSamplingInterval(100); // 100 microsecond sampling resolution, (1000 is default)
            
            Profiler.start();
            Runtime.evaluate({ "expression": " startTest(); " });
            
            // for now, hacky 10 second timeout. Could be better.
            setTimeout(function(){
                Profiler.stop({}, saveProfile);
            }, 10*1000);
        });
    }
}).on('error', function () {
    console.error('Cannot connect to Chrome');
});


function saveProfile(name, CPUProfile, desc){
    // CPUProfile object described here:
    //   code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/protocol.json&q=protocol.json%20CPUProfileNode&sq=package:chromium&type=cs

    // either:
    // 1. process the data in node or …
    // 2. save as JSON to disk, open Chrome DevTools, Profiles tab, select CPU Profile radio button, click `load`
    //    and view the profile data in the full devtools UI.
    
    var file = 'profile-' + Date.now() + '.cpuprofile';
    var data = JSON.stringify(CPUProfile.profile, null, 2);
    fs.writeFileSync(file, data);
    console.log('Done! See ' + file);
}
```
#### Enjoy!

 Please file issues or PR any updates as you try things.

#### Why?

Testing the performance of asynchronous code is difficult. Obviously measuring endTime - startTime doesn't work. Using a profiler gives you the insight of how many microseconds the CPU spent within each script, function and its children. For async usecases, in particular, you can now evaluate differences much easier.

### Contributors
* paul irish
* [@vladikoff](http://github.com/vladikoff) 
