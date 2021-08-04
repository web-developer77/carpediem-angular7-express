import { Component, OnInit } from '@angular/core';
declare var jwplayer: any;

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})

export class VideoComponent implements OnInit {
  video_key = 'YpqF9wwU';

  constructor(
    
  ) { }
  ngOnInit() {
    jwplayer('player').setup({
      title: 'Player Test',
      playlist: 'https://cdn.jwplayer.com/v2/media/' + this.video_key,
      aspectratio: '16:9',
      mute: false,
      autostart: true,
      primary: 'html5',
    });
  }

}
