import Peaks from '../../src/main';
import { Segment } from '../../src/segment';

import InputController from '../helpers/input-controller';

function getEmitCalls(emit, eventName) {
  const calls = [];

  for (let i = 0; i < emit.callCount; i++) {
    const call = emit.getCall(i);

    if (call.args[0] === eventName) {
      calls.push(call);
    }
  }

  return calls;
}

describe('WaveformZoomView', function() {
  let p = null;
  let zoomview = null;
  let inputController = null;

  beforeEach(function(done) {
    const options = {
      overview: {
        container: document.getElementById('overview-container')
      },
      zoomview: {
        container: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      segments: [
        { id: 'segment1', startTime: 1.0,  endTime: 2.0, editable: true },
        { id: 'segment2', startTime: 3.0,  endTime: 4.0, editable: true },
        { id: 'segment3', startTime: 11.0, endTime: 12.0, editable: true },
        { id: 'segment4', startTime: 13.0, endTime: 14.0, editable: true }
      ]
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);

      p = instance;
      zoomview = instance.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      inputController = new InputController('zoomview-container');

      done();
    });
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
      zoomview = null;
    }
  });

  describe('enableSegmentDragging', function() {
    context('when enabled', function() {
      beforeEach(function() {
        zoomview.enableSegmentDragging(true);
      });

      context('when dragging a segment', function() {
        it('should move the segment to the right', function() {
          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });

        it('should move the segment to the left', function() {
          const distance = -50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });

        it('should prevent the start time from becoming less than zero', function() {
          const distance = -100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(0.0);
          expect(segment.endTime).to.equal(1.0);
        });

        it('should emit a segments.dragged event', function() {
          const view = p.views.getView('zoomview');
          const emit = sinon.spy(p, 'emit');

          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].marker).to.equal(false);
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });
      });

      context('when dragging the waveform', function() {
        it('should scroll the waveform to the right', function() {
          const distance = -50;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(50);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(50));
        });

        it('should scroll the waveform to the left', function() {
          zoomview.updateWaveform(500);

          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(400);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(400));
        });

        it('should not scroll beyond the start of the waveform', function() {
          const distance = 200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(0);
          expect(zoomview.getStartTime()).to.equal(0);
        });

        it('should not scroll beyond the end of the waveform', function() {
          zoomview.setStartTime(20);

          const distance = -200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(1826);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(1826));
        });
      });
    });

    context('when disabled', function() {
      beforeEach(function() {
        zoomview.enableSegmentDragging(false);
      });

      context('when dragging the waveform view', function() {
        it('should scroll the waveform to the right', function() {
          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 - distance, y: 50 });
          inputController.mouseUp({ x: 100 - distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(100);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(distance));
        });

        it('should scroll the waveform to the left', function() {
          zoomview.updateWaveform(500);

          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(400);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(400));
        });

        it('should prevent the start time from becoming less than zero', function() {
          zoomview.updateWaveform(100);

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(0);
          expect(zoomview.getStartTime()).to.equal(0);
        });
      });
    });
  });

  describe('setSegmentDragMode', function() {
    beforeEach(function(done) {
      zoomview.enableSegmentDragging(true);
      setTimeout(done, 50);
    });

    context('overlap', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('overlap');
      });

      context('when dragging a segment over the next segment', function() {
        it('should emit a segments.dragged event', function() {
          const view = p.views.getView('zoomview');
          const emit = sinon.spy(p, 'emit');

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment1');
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });

        it('should not move the next segment', function() {
          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(3.0);
          expect(nextSegment.endTime).to.equal(4.0);
        });
      });

      context('when dragging a segment over the previous segment', function() {
        it('should emit a segments.dragged event', function() {
          const view = p.views.getView('zoomview');
          const emit = sinon.spy(p, 'emit');

          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment2');
          expect(calls[0].args[1].segment.startTime).to.equal(3.0 + view.pixelsToTime(distance));
          expect(calls[0].args[1].segment.endTime).to.equal(4.0 + view.pixelsToTime(distance));
        });

        it('should not move the previous segment', function() {
          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const previousSegment = p.segments.getSegment('segment1');

          expect(previousSegment.startTime).to.equal(1.0);
          expect(previousSegment.endTime).to.equal(2.0);
        });
      });

      context('when dragging a segment start marker', function() {
        it('should not move the start marker beyond the end marker', function() {
          const clickX = 86;
          const distance = 150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(segment.endTime);
        });

        it('should not move the start marker beyond the visible time range', function() {
          const clickX = 86;
          const distance = -150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(0.0);
        });

        it('should not move the previous segment', function() {
          const clickX = 258;
          const distance = -150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment2');

          const view = p.views.getView('zoomview');

          expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
          expect(segment.endTime).to.equal(4.0);

          const previousSegment = p.segments.getSegment('segment1');

          expect(previousSegment.startTime).to.equal(1.0);
          expect(previousSegment.endTime).to.equal(2.0);
        });

        it('should not move the start marker beyond the waveform view', function() {
          const clickX = 86;
          const distance = -100;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(0);
        });

        context('and the segment overlaps the end of the waveform view', function() {
          it('should not move the start marker beyond the waveform view', function() {
            const clickX = 947;
            const distance = 100;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment3');

            expect(segment.startTime).to.equal(view.pixelsToTime(view.getWidth()));
          });
        });
      });

      context('when a segment start marker has been dragged over the previous segment', function() {
        it('should be possible to drag the previous segment end marker', function() {
          const firstClickX = 258;
          const firstDistance = -150;

          inputController.mouseDown({ x: firstClickX, y: 50 });
          inputController.mouseMove({ x: firstClickX + firstDistance, y: 50 });
          inputController.mouseUp({ x: firstClickX + firstDistance, y: 50 });

          const secondClickX = 172;
          const secondDistance = 150;

          inputController.mouseDown({ x: secondClickX, y: 50 });
          inputController.mouseMove({ x: secondClickX + secondDistance, y: 50 });
          inputController.mouseUp({ x: secondClickX + secondDistance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment1 = p.segments.getSegment('segment1');
          const segment2 = p.segments.getSegment('segment2');

          expect(segment1.startTime).to.equal(1.0);
          expect(segment1.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + secondDistance));
          expect(segment2.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + firstDistance));
          expect(segment2.endTime).to.equal(4.0);
        });
      });

      context('when dragging a segment end marker', function() {
        it('should not move the end marker beyond the start marker', function() {
          const clickX = 172;
          const distance = -150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.endTime).to.equal(segment.startTime);
        });

        it('should move the end marker', function() {
          const clickX = 172;
          const distance = 150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0);
          expect(segment.endTime).to.equal(view.pixelsToTime(clickX + distance));
        });

        it('should not move the next segment', function() {
          const clickX = 172;
          const distance = 150;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(3.0);
          expect(nextSegment.endTime).to.equal(4.0);
        });

        it('should not move the end marker beyond the waveform view', function() {
          const clickX = 172;
          const distance = 1000;

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.endTime).to.equal(view.pixelsToTime(view.getWidth()));
        });

        context('and the segment overlaps the start of the waveform view', function() {
          beforeEach(function(done) {
            zoomview.setStartTime(1.5);
            setTimeout(done, 50);
          });

          it('should not move the end marker beyond the start of the waveform view', function() {
            const clickX = 43;
            const distance = -100;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment1');

            expect(segment.endTime).to.equal(view.pixelsToTime(view.getFrameOffset()));
          });
        });
      });

      context('when a segment end marker has been dragged over the next segment', function() {
        it('should be possible to drag the next segment start marker', function() {
          const firstClickX = 172;
          const firstDistance = 150;

          inputController.mouseDown({ x: firstClickX, y: 50 });
          inputController.mouseMove({ x: firstClickX + firstDistance, y: 50 });
          inputController.mouseUp({ x: firstClickX + firstDistance, y: 50 });

          const secondClickX = 258;
          const secondDistance = -150;

          inputController.mouseDown({ x: secondClickX, y: 50 });
          inputController.mouseMove({ x: secondClickX + secondDistance, y: 50 });
          inputController.mouseUp({ x: secondClickX + secondDistance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment1 = p.segments.getSegment('segment1');
          const segment2 = p.segments.getSegment('segment2');

          expect(segment1.startTime).to.equal(1.0);
          expect(segment1.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + firstDistance));
          expect(segment2.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + secondDistance));
          expect(segment2.endTime).to.equal(4.0);
        });
      });
    });

    context('no-overlap', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('no-overlap');
      });

      context('when dragging a segment over the next segment', function() {
        it('should move the segment adjacent to the next segment', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment1');
          expect(calls[0].args[1].segment.startTime).to.equal(2.0);
          expect(calls[0].args[1].segment.endTime).to.equal(3.0);
        });

        it('should not move the next segment', function() {
          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(3.0);
          expect(nextSegment.endTime).to.equal(4.0);
        });
      });

      context('when dragging a segment over the previous segment', function() {
        it('should move the segment adjacent to the previous segment', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment2');
          expect(calls[0].args[1].segment.startTime).to.equal(2.0);
          expect(calls[0].args[1].segment.endTime).to.equal(3.0);
        });

        it('should not move the previous segment', function() {
          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const previousSegment = p.segments.getSegment('segment1');

          expect(previousSegment.startTime).to.equal(1.0);
          expect(previousSegment.endTime).to.equal(2.0);
        });
      });

      context('when dragging a segment end marker', function() {
        context('and the end marker does not overlap the next segment', function() {
          it('should move the segment end marker', function() {
            const clickX = 172;
            const distance = 50;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment1');
            const nextSegment = p.segments.getSegment('segment2');

            expect(segment.startTime).to.equal(1.0);
            expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + distance));
            expect(nextSegment.startTime).to.equal(3.0);
            expect(nextSegment.endTime).to.equal(4.0);
          });
        });

        context('and the end marker overlaps the next segment', function() {
          it('should move the segment end marker adjacent to the next segment', function() {
            const clickX = 172;
            const distance = 150;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const segment = p.segments.getSegment('segment1');
            const nextSegment = p.segments.getSegment('segment2');

            expect(segment.startTime).to.equal(1.0);
            expect(segment.endTime).to.equal(nextSegment.startTime);
            expect(nextSegment.startTime).to.equal(3.0);
            expect(nextSegment.endTime).to.equal(4.0);
          });
        });
      });

      context('when dragging a segment start marker', function() {
        context('and the start marker does not overlap the previous segment', function() {
          it('should move the segment start marker', function() {
            const clickX = 258;
            const distance = -50;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment2');
            const previousSegment = p.segments.getSegment('segment1');

            expect(previousSegment.startTime).to.equal(1.0);
            expect(previousSegment.endTime).to.equal(2.0);
            expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
            expect(segment.endTime).to.equal(4.0);
          });
        });

        context('and the start marker overlaps the previous segment', function() {
          it('should move the segment start marker adjacent to the previous segment', function() {
            const clickX = 258;
            const distance = -150;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const segment = p.segments.getSegment('segment2');
            const previousSegment = p.segments.getSegment('segment1');

            expect(previousSegment.startTime).to.equal(1.0);
            expect(previousSegment.endTime).to.equal(2.0);
            expect(segment.startTime).to.equal(previousSegment.endTime);
            expect(segment.endTime).to.equal(4.0);
          });
        });
      });
    });

    context('compress', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('compress');
        zoomview.setMinSegmentDragWidth(20);
      });

      context('when dragging a segment over the next segment', function() {
        context('and does not reach the minimum width of the next segment', function() {
          it('should move the next segment start time', function() {
            const view = p.views.getView('zoomview');
            const emit = sinon.spy(p, 'emit');

            const distance = 150;

            inputController.mouseDown({ x: 100, y: 50 });
            inputController.mouseMove({ x: 100 + distance, y: 50 });
            inputController.mouseUp({ x: 100 + distance, y: 50 });

            const calls = getEmitCalls(emit, 'segments.dragged');
            expect(calls.length).to.equal(2);

            expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[0].args[1].segment.id).to.equal('segment1');
            expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
            expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));

            expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[1].args[1].segment.id).to.equal('segment2');
            expect(calls[1].args[1].segment.startTime).to.equal(2.0 + view.pixelsToTime(distance));
            expect(calls[1].args[1].segment.endTime).to.equal(4.0);
          });
        });

        context('and reaches the minimum width of the next segment', function() {
          it('should compress the next segment to a minimum width', function() {
            const view = p.views.getView('zoomview');
            const emit = sinon.spy(p, 'emit');

            const distance = 300;

            inputController.mouseDown({ x: 100, y: 50 });
            inputController.mouseMove({ x: 100 + distance, y: 50 });
            inputController.mouseUp({ x: 100 + distance, y: 50 });

            const calls = getEmitCalls(emit, 'segments.dragged');
            expect(calls.length).to.equal(2);

            expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[0].args[1].segment.id).to.equal('segment1');
            expect(calls[0].args[1].segment.startTime).to.equal(3.0 - view.pixelsToTime(20));
            expect(calls[0].args[1].segment.endTime).to.equal(4.0 - view.pixelsToTime(20));

            expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[1].args[1].segment.id).to.equal('segment2');
            expect(calls[1].args[1].segment.startTime).to.equal(4.0 - view.pixelsToTime(20));
            expect(calls[1].args[1].segment.endTime).to.equal(4.0);
          });
        });
      });

      context('when dragging a segment over the previous segment', function() {
        context('and does not reach the minimum width of the previous segment', function() {
          it('should move the previous segment end time', function() {
            const view = p.views.getView('zoomview');
            const emit = sinon.spy(p, 'emit');

            const distance = -150;

            inputController.mouseDown({ x: 300, y: 50 });
            inputController.mouseMove({ x: 300 + distance, y: 50 });
            inputController.mouseUp({ x: 300 + distance, y: 50 });

            const calls = getEmitCalls(emit, 'segments.dragged');
            expect(calls.length).to.equal(2);

            expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[0].args[1].segment.id).to.equal('segment2');
            expect(calls[0].args[1].segment.startTime).to.equal(3.0 + view.pixelsToTime(distance));
            expect(calls[0].args[1].segment.endTime).to.equal(4.0 + view.pixelsToTime(distance));

            expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[1].args[1].segment.id).to.equal('segment1');
            expect(calls[1].args[1].segment.startTime).to.equal(1.0);
            expect(calls[1].args[1].segment.endTime).to.equal(3.0 + view.pixelsToTime(distance));
          });
        });

        context('and reaches the minimum width of the previous segment', function() {
          it('should compress the previous segment to a minimum width', function() {
            const view = p.views.getView('zoomview');
            const emit = sinon.spy(p, 'emit');

            const distance = -300;

            inputController.mouseDown({ x: 300, y: 50 });
            inputController.mouseMove({ x: 300 + distance, y: 50 });
            inputController.mouseUp({ x: 300 + distance, y: 50 });

            const calls = getEmitCalls(emit, 'segments.dragged');
            expect(calls.length).to.equal(2);

            expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[0].args[1].segment.id).to.equal('segment2');
            expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(20));
            expect(calls[0].args[1].segment.endTime).to.be.closeTo(2.0 + view.pixelsToTime(20), 1e-15); // TODO

            expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
            expect(calls[1].args[1].segment.id).to.equal('segment1');
            expect(calls[1].args[1].segment.startTime).to.equal(1.0);
            expect(calls[1].args[1].segment.endTime).to.equal(1.0 + view.pixelsToTime(20));
          });
        });
      });

      context('when dragging a segment end marker over the next segment', function() {
        context('and does not reach the minimum width of the next segment', function() {
          it('should move the next segment start time', function() {
            const clickX = 172;
            const distance = 100;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment1');
            const nextSegment = p.segments.getSegment('segment2');

            expect(segment.startTime).to.equal(1.0);
            expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + distance));
            expect(nextSegment.startTime).to.equal(segment.endTime);
            expect(nextSegment.endTime).to.equal(4.0);
          });
        });

        context('and reaches the minimum width of the next segment', function() {
          it('should compress the next segment to a minimum width', function() {
            const clickX = 172;
            const distance = 200;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment1');
            const nextSegment = p.segments.getSegment('segment2');

            expect(segment.startTime).to.equal(1.0);
            expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(4.0) - 50));
            expect(nextSegment.startTime).to.equal(segment.endTime);
            expect(nextSegment.endTime).to.equal(4.0);
          });
        });
      });

      context('when dragging a segment start marker over the previous segment', function() {
        context('and does not reach the minimum width of the previous segment', function() {
          it('should move the previous segment end time', function() {
            const clickX = 254;
            const distance = -100;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment2');
            const previousSegment = p.segments.getSegment('segment1');

            expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
            expect(segment.endTime).to.equal(4.0);
            expect(previousSegment.startTime).to.equal(1.0);
            expect(previousSegment.endTime).to.equal(segment.startTime);
          });
        });

        context('and reaches the minimum width of the previous segment', function() {
          it('should compress the previous segment to the minimum width', function() {
            const clickX = 254;
            const distance = -200;

            inputController.mouseDown({ x: clickX, y: 50 });
            inputController.mouseMove({ x: clickX + distance, y: 50 });
            inputController.mouseUp({ x: clickX + distance, y: 50 });

            const view = p.views.getView('zoomview');
            const segment = p.segments.getSegment('segment2');
            const previousSegment = p.segments.getSegment('segment1');

            expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(1.0) + 50));
            expect(segment.endTime).to.equal(4.0);
            expect(previousSegment.startTime).to.equal(1.0);
            expect(previousSegment.endTime).to.equal(segment.startTime);
          });
        });
      });
    });
  });
});
