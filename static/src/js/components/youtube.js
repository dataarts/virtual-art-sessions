'use strict';

import $ from 'jquery';

export function open(modal) {
  initScript_(modal);
}

export function close(modal) {
  for (let id in modal.state.players) {
    const player = modal.state.players[id];
    if (player.hasOwnProperty('pauseVideo')) {
      player.pauseVideo();
    }
  }
}

function initScript_(modal) {
  if (typeof(YT) == 'undefined' || typeof(YT.Player) == 'undefined') {
    window.onYouTubeIframeAPIReady = function() {
      initPlayers_(modal);
    };

    $.getScript('https://www.youtube.com/iframe_api');
  } else {
    initPlayers_(modal);
  }
}

function initPlayers_(modal) {
  const $players = modal.$element.find('[data-video-id]');
  $players.each(function() {
    initPlayer_($(this), modal);
  });
}

function initPlayer_($element, modal) {
  const videoId = $element.data('videoId');
  const player = new YT.Player($element[0], {
    videoId: videoId,
    width: '100%',
    height: '100%',
    playerVars: {
      modestbranding: 1,
      rel: 0,
    },
  });
  if (!modal.state.players.hasOwnProperty(videoId)) {
    modal.state.players[videoId] = player;
  }
}
