import { Component, OnInit } from '@angular/core';

import { InstructoresService } from 'src/app/shared/services/instructor.service';
import { Instructor } from 'src/app/shared/models/instructors';

@Component({
  selector: 'app-instructors',
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.scss']
})
export class InstructorsComponent implements OnInit {
  instructorSliderCursor: number = 1
  instructorSliderPosition: string = 'translateX(0px)'
  instructors: Instructor[] = [];
  instructors_copy: Instructor[] = [];
  loading: boolean = true
  instructorWidth = 0
  filter: string;
  mobile = false;

  constructor(
    private instructoresService: InstructoresService,
  ) { }

  swipedetect(el, callback) {
    let touchsurface = el,
      swipedir,
      startX,
      startY,
      distX,
      distY,
      threshold = 100,
      restraint = 50,
      allowedTime = 300,
      elapsedTime,
      startTime,
      handleswipe = callback || function () { }

    touchsurface.addEventListener('touchstart', (e) => {
      var touchobj = e.changedTouches[0]
      swipedir = 'none'
      startX = touchobj.pageX
      startY = touchobj.pageY
      startTime = new Date().getTime()
      // e.preventDefault()
    }, false)

    touchsurface.addEventListener('touchmove', (e) => {
      // e.preventDefault()
    }, false)

    touchsurface.addEventListener('touchend', (e) => {
      var touchobj = e.changedTouches[0]
      distX = touchobj.pageX - startX
      distY = touchobj.pageY - startY
      elapsedTime = new Date().getTime() - startTime
      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          swipedir = (distX < 0) ? 'left' : 'right'

          handleswipe(swipedir)
        } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          // swipedir = (distY < 0)? 'up' : 'down'
        }
      }
    }, false)
  }

  ngOnInit() {
    if (window.screen.width < 600) { // 768px portrait
      this.mobile = true;
    }
    this.instructoresService.getInstructoresInfo().subscribe(instructors => {
      this.instructors = instructors;
      this.instructors_copy = instructors;
      this.filterInstructor('Indoor Cycling');

      setTimeout(() => {
        const instructorsRendered = Array.from(document.getElementsByClassName('instructor-intro'))

        if (instructorsRendered.length) {
          this.instructorWidth = instructorsRendered[0].clientWidth
          instructorsRendered.map((instructor, index) =>
            this.swipedetect(instructor, (swipedir) => {
              if (
                (index === 0 && swipedir === 'right') ||
                (index + 1 === instructorsRendered.length && swipedir === 'left')
              ) return

              const currentPosition = index + 1
              const nextPosition = swipedir === 'right' ? currentPosition - 1 : currentPosition + 1
              this.moveInstructorsSlider(nextPosition)
            })
          )
        }

        this.loading = false
      }, 600)
    })
  }

  filterInstructor(filter: string): void {
    this.filter = filter;
    if (this.filter == 'Indoor Cycling') {
      this.instructors = this.instructors_copy.filter(instructor => instructor.class_type == filter);
    } else {
      this.instructors = this.instructors_copy.filter(instructor => instructor.class_type == 'Yoga' || instructor.class_type == 'Funcional');
    }
    this.moveInstructorsSlider(1);
  }

  moveInstructorsSlider(position): void {
    let instructorContainerWidth;
    const windowWidth = window.outerWidth

    if (windowWidth <= 700) {
      instructorContainerWidth = this.instructorWidth + 22.5;
    } else {
      instructorContainerWidth = 895
    }

    if (position > 1) {
      this.instructorSliderPosition = `translateX(-${(position - 1) * instructorContainerWidth}px)`
    } else {
      this.instructorSliderPosition = 'translateX(0px)'
    }

    this.instructorSliderCursor = position
  }
}
