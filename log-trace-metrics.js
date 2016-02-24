const filename = 'demo/mdn-fling.json'

var fs = require('fs')
var traceToTimelineModel = require('./lib/timeline-model.js')

var events = fs.readFileSync(filename, 'utf8')
var model = traceToTimelineModel(events)

console.log('')
console.log('Timeline model events:', model.timelineModel.mainThreadEvents().length)
console.log('IR model interactions', model.irModel.interactionRecords().length)
console.log('Frame model frames', model.frameModel.frames().length)

