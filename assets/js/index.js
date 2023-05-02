/**
 * 1. Render songs
 * 2. Scroll top
 * 3. Play / pause / seek
 * 4. CD rotate
 * 5. Next / prev
 * 6. Random
 * 7. Next / Repeat when ended
 * 8. Active song
 * 9. Scroll active song into view
 * 10. Play song when click
 */

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelector.bind(document);

    const PLAYER_STORAGE_KEY = 'f8_PLAYER';

    const playlist = $('.playlist');
    const player = $('.player');
    const cd = $('.cd');
    const heading = $('header h2');
    const cdThumb = $('.cd-thumb');
    const audio = $('#audio');
    const playBtn = $('.btn-toggle-play');
    const nextBtn = $('.btn-next');
    const prevBtn = $('.btn-prev');
    const randomBtn = $('.btn-random');
    const repeatBtn = $('.btn-repeat');
    const progress = $('#progress');

    const app = {
        currentIndex: 0,
        isPlaying: false,
        isRandom: false,
        isRepeat: false,
        config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
        setConfig: function(key, value) {
            this.config[key] = value;
            localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
        },
        songs: [
            {
                name: 'ANH NHỚ RA - Vũ. (Solo Version) / Live Session',
                singer: 'Vũ',
                path: './assets/music/anh-nhan-ra.mp3',
                image: './assets/img/anh-nhan-ra.jpg',
            },
            {
                name: 'MỸ TÂM - HẸN ƯỚC TỪ HƯ VÔ (LIVE) | MY SOUL 1981',
                singer: 'Mỹ Tâm',
                path: './assets/music/hen-uoc-tu-hu-vo.mp3',
                image: './assets/img/hen-uoc-tu-hu-vo.jpg',
            },
            {
                name: 'MIN - CÀ PHÊ | OFFICIAL MUSIC VIDEO',
                singer: 'Min',
                path: './assets/music/ca-phe.mp3',
                image: './assets/img/ca-phe.jpg',
            },
            {
                name: 'MONO - Waiting For You (Album 22 - Track No.10)',
                singer: 'MONO',
                path: './assets/music/waiting-for-you.mp3',
                image: './assets/img/waiting-for-you.jpg',
            },
        ],
        render: function() {
            const htmls = this.songs.map((song, index) => {
                return `
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                    <div class="thumb" style="background-image: url('${song.image}')"></div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
                `;
            });

            playlist.innerHTML = htmls.join('');
        },
        defineProperties: function() {
            Object.defineProperty(this, 'currentSong', {
                get: function() {
                    return this.songs[this.currentIndex];
                }
            });
        },
        handleEvents: function() {
            // lưu biến this của obj app. vì trong hàm callback ko gọi được
            const _this = this;

            // Xử lý CD quay / dừng
            // Animate 
            const cdThumbAnimate = cdThumb.animate([
                {transform: 'rotate(360deg)'}
            ], {
                duration: 10000,
                iterations: Infinity
            });
            cdThumbAnimate.pause();
            
            // Xử lý phóng to / thu nhỏ CD
            const cdWidth = cd.offsetWidth;
            document.onscroll = function() {
                const scrollTop = window.scrollY || document.documentElement.scrollTop
                const newCdWidth = cdWidth - scrollTop;
                cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0;
                cd.style.opacity = newCdWidth / cdWidth;
            }
            
            // Xử lý khi click play
            playBtn.onclick = function() {
                if(_this.isPlaying) {
                    audio.pause();
                } else {
                    audio.play();
                }  
            }
            
            // khi song được play
            audio.onplay = function() {
               _this.isPlaying = true;
               player.classList.add('playing');
               cdThumbAnimate.play();
            }

            // khi song bị pause
            audio.onpause = function() {
                _this.isPlaying = false;
                player.classList.remove('playing');
                cdThumbAnimate.pause();
            }

            // Khi tiến độ bài hát thay đổi
            audio.ontimeupdate = function() {
                if(audio.duration) {
                    const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
                    progress.value = progressPercent;
                }
            }

            // Xử lý khi tua song
            progress.onchange = function(e) {
               const seekTime = audio.duration / 100 * e.target.value;
               audio.currentTime = seekTime;
            }

            // Xử lý next song
            nextBtn.onclick = function() {
                if(_this.isRandom) {
                    _this.playRandomSong();
                } else {
                    _this.nextSong();
                }
                audio.play();
                _this.render();
                _this.scrollToActiveSong();
            }

            // Xử lý prev song
            prevBtn.onclick = function() {
                if(_this.isRandom) {
                    _this.playRandomSong();
                } else {
                    _this.prevSong();
                }
                audio.play();
                _this.render();
                _this.scrollToActiveSong();
            }

            // xử lý bật / tắt random song
            randomBtn.onclick = function(e) {
                _this.isRandom = !_this.isRandom;
                _this.setConfig('isRandom', _this.isRandom);
                randomBtn.classList.toggle('active', _this.isRandom);
            }

            // xử lý lặp lại môt song
            repeatBtn.onclick = function() {
                _this.isRepeat = !_this.isRepeat;
                _this.setConfig('isRepeat', _this.isRepeat);
                repeatBtn.classList.toggle('active', _this.isRepeat);
            }

            // xử lý next song khi audio ended
            audio.onended = function() {
                if(_this.isRepeat) {
                    audio.play();
                } else {
                    nextBtn.click();
                }
            }

            // lắng nghe hành vi playlist trong list
            playlist.onclick = function (e) {
                const songNode = e.target.closest('.song:not(.active)');
                // không play khi click song active
                // không play khi click option
                if( songNode || e.target.closest('.option')) {
                    // xử lý khi click vào song
                    if(songNode) {
                        _this.currentIndex = Number(songNode.dataset.index) // data-index của elm song (tiền tố data, tên index)
                        _this.loadCurrentSong();
                        audio.play();
                        _this.render();
                    }

                    // xử lý khi click vào option
                    if(e.target.closest('.option')) {

                    }
                }
            }
        },
        scrollToActiveSong: function() {
            setTimeout(() => {
                $('.song.active').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 300);
        },
        loadConfig: function() {
            this.isRandom = this.config.isRandom;
            this.isRepeat = this.config.isRepeat;
        },
        currentSong: function() {
            return this.songs[this.currentIndex];
        },
        loadCurrentSong: function() {
            heading.textContent = this.currentSong.name;
            cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
            audio.src = this.currentSong.path;
        },
        nextSong: function() {
            this.currentIndex++;
            if(this.currentIndex >= this.songs.length) {
                this.currentIndex = 0;
            }
            this.loadCurrentSong();
        },
        prevSong: function() {
            this.currentIndex--;
            if(this.currentIndex < 0) {
                this.currentIndex = this.songs.length - 1;
            }
            this.loadCurrentSong();
        },
        playRandomSong: function() {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * this.songs.length);
            } while(newIndex === this.currentIndex);

            this.currentIndex = newIndex;
            this.loadCurrentSong();
        },
        start: function() {
            // gán cấu hình từ config đã lưu vào obj app
            this.loadConfig();
            // Dinh nghia cac thuoc tinh cho obj
            this.defineProperties();
            // lang nghe xu ly cac su kien
            this.handleEvents();
            // tai thong tin bai hat dau tien
            this.loadCurrentSong();
            // render danh sach bai hat
            this.render(); 

            // Hiển thị trạng thái ban đầu của 2 nút
            randomBtn.classList.toggle('active', this.isRandom);
            repeatBtn.classList.toggle('active', this.isRepeat);
        }
    }

    app.start();