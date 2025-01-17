import { HttpParams } from '@angular/common/http';
import { Component, DEFAULT_CURRENCY_CODE, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise, switchMap, take } from 'rxjs';
import { Episode } from 'src/app/models/episode.model';
import { Movie } from 'src/app/models/movie.model';
import { MoviesService } from 'src/app/services/movies.service';
import { RouterService } from 'src/app/services/router.service';
import { TvService } from 'src/app/services/tv.service';
import { trigger, transition, animate, style } from '@angular/animations';
import { Tv } from 'src/app/models/tv.model';
import { flush } from '@angular/core/testing';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit {

  video : string;

  movie : Movie;
  show : Tv;
  Name : string;
  Desc : string;
  Genre : string;
  source : string;
  Thumbnail : string;
  Trailer : string;

  recommended : any[];
  episodes : Episode[];
  seasons : number[] = [];
  currentSeason : number = 1;
  currentEpisode : Episode;
  totalSeasons : number;
  httpParams : HttpParams;
  httpGenreParams : HttpParams;
  type : string;
  isPlayed : boolean = false;
  isReady : boolean = false;
  isTrailer : boolean = false;
  playText : string = 'PLAY';
  genresArr : string[];

  public screenWidth: any;
  public screenHeight: any;

  constructor(private router : Router, private movieService : MoviesService,
              private tvservice : TvService, private videoservice : VideoService) { 
  
  }

  ngOnInit(): void {
    if(this.router.url == '/video') this.router.navigate(['/']);
    this.setYtPlayerWidth();
    if(this.router.url.charAt(9) == 'm'){
      this.type = 'm';
      this.getMovie();
    }
    else if(this.router.url.charAt(9) == 's'){
      this.type = 's';
      this.getShow();
    }
    else{
      this.router.navigate(['/']);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setYtPlayerWidth();
  }

  setYtPlayerWidth(){
    if(window.innerWidth < 768){
      this.screenWidth = (.75 * window.innerWidth);
    }
    else if(window.innerWidth < 502){
      this.screenWidth = (window.innerWidth);
    }
    else{
      this.screenWidth = (.5 * window.innerWidth);
    }
    this.screenHeight = (this.screenWidth * 9) / 16;
  }

  getMovie(){
    this.movieService.getMovie(this.router.url).pipe(switchMap( (data) => { 
      if(data.length == 0) this.router.navigate(['/']);
      this.movie = data[0];
      this.setMovie();
      this.genresArr = this.movie.Genre.replace(/\s/g, '').split(',');
      this.constructGenreParams(this.genresArr[0]);
      return this.movieService.getAllMovies(this.httpGenreParams);
    })).subscribe( data => {
      this.recommended = data[0];
      this.setMoviesLikeThis();
    });
  }

  setMovie(){
    this.Name = this.movie.Name;
    this.Desc = this.movie.Desc;
    this.Genre = this.movie.Genre;
    this.source = this.movie.Video;
    this.videoservice.getSource(new HttpParams().set('source',this.source)).subscribe( data => {
      this.video = data.url;
      this.isReady = true;
    });
    this.Thumbnail = this.movie.Thumbnail;
    this.Trailer = this.movie.Trailer;
  }

  getShow(){
    this.tvservice.getShow(this.router.url).pipe( switchMap( data => {
      if(data[0].length == 0) this.router.navigate(['/']);
      this.show = data[0][0];
      this.totalSeasons = data[2][0].totalSeasons;
      this.setShow();
      return this.tvservice.getAllShows(this.httpGenreParams);
    })).pipe( switchMap (data => {
      this.recommended = data[0];
      this.setShowsLikeThis();
      return this.tvservice.getShowSeason(this.httpParams);
    })).subscribe( data => {
      this.episodes = data[0];
      this.setShowEpisodes();
    });
  }

  setShow(){
    this.Name = this.show.Name;
    this.Genre = this.show.Genre;
    this.Thumbnail = this.show.Thumbnail;
    this.Trailer = this.show.Trailer;
    this.constructParams(this.show.Name.replace(/'/g, "''"),1);
    this.genresArr = this.show.Genre.replace(/\s/g, '').split(',');
    this.constructGenreParams(this.genresArr[0]);
    this.setSeasons(this.totalSeasons);
  }
  setShowEpisodes(){
    this.Desc = this.episodes[0].Desc;
    this.source = this.episodes[0].Video;
    this.videoservice.getSource(new HttpParams().set('source',this.source)).subscribe( data => {
      this.video = data.url;
      this.isReady = true;
    });
    this.currentEpisode = this.episodes[0];
  }

  constructParams(showName : string, season : number){
    this.httpParams = new HttpParams()
    .set('showName',showName)
    .set('season',season);
  }

  constructGenreParams(genre : string){
    this.httpGenreParams = new HttpParams()
      .set('currentPage', 1)
      .set('size', 6)
      .set('search', '')
      .set('genre', genre)
      .set('orderBy', 'Rating')
      .set('orderDir', 'DESC');
  }
  

  setSeasons(totalSeasons : number){
    for(let i = 1; i <= this.totalSeasons; i++){
      this.seasons[i-1] = i;
    }
  }

  changeSeason(season : number){
    this.currentSeason = season;
    this.constructParams(this.show.Name.replace(/'/g, "''"),season);
    this.tvservice.getShowSeason(this.httpParams).subscribe( data => {
      this.episodes = data[0];
    });
  }

  changeEpisode(episode : Episode){
    this.currentEpisode = episode;
    this.source = episode.Video;
    this.videoservice.getSource(new HttpParams().set('source',this.source)).subscribe( data => {
      this.video = data.url;
    });
    this.Desc = episode.Desc;
  }

  setMoviesLikeThis(){
      this.recommended = this.recommended.filter( (item : any ) => { return item.Name != this.movie.Name});
      if(this.recommended.length > 5) { 
        this.recommended.pop();
      }

  }
  setShowsLikeThis(){
    this.recommended = this.recommended.filter( (item : any ) => { return item.Name != this.show.Name});
    if(this.recommended.length > 5) { 
      this.recommended.pop();
    }
  }

  playAction(){
    this.isPlayed=!this.isPlayed;
    this.isTrailer = false;
    this.playText = 'PLAYED';
  }
  trailerAction(){
    this.isTrailer = !this.isTrailer;
    this.isPlayed = false;
    this.playText = 'PLAY';
  }

  hasEnded($event : any){
    if($event && this.type == 's'){
      let nextEpisode = this.episodes.filter( (episode : Episode) => {return episode.Episode == this.currentEpisode.Episode+1});
      if(nextEpisode.length != 0){
        this.changeEpisode(nextEpisode[0]);
      }
    }
  }

  getAllLikeThis(genre : string){
    if(this.router.url.charAt(9) == 'm'){
      this.router.navigate(['movies'], { queryParams : { g : genre}});
    }
    else if(this.router.url.charAt(9) == 's'){
      this.router.navigate(['tv'], { queryParams : { g : genre}});
    }
    
  }


}
