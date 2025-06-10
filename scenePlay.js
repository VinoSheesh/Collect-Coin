var scenePlay = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay" });
    this.gameStarted = false;
    this.currentLevel = 1;
    this.countCoin = 0; // Initialize countCoin as scene property
    // Add checkpoint positions for each level
    this.checkpoints = {
      1: { x: 100, y: 500 },
      2: { x: 100, y: 500 },
      3: { x: 100, y: 500 },
    };
  },

  init: function () {},

  preload: function () {
    // Update paths to use direct references
    this.load.image("coin", "./assets/images/Koin.png");
    this.load.image("coin_panel", "./assets/images/PanelCoin.png");
    this.load.image("background", "./assets/images/BG.png");
    this.load.image("btn_play", "./assets/images/ButtonPlay.png");
    this.load.image("gameover", "./assets/images/GameOver.png");
    this.load.image("enemy1", "./assets/images/Musuh01.png");
    this.load.image("enemy2", "./assets/images/Musuh02.png");
    this.load.image("enemy3", "./assets/images/Musuh03.png");
    this.load.image("ground", "./assets/images/Tile50.png");
    this.load.audio("snd_coin", "./assets/audio/koin.mp3");
    this.load.audio("snd_lose", "./assets/audio/kalah.mp3");
    this.load.audio("snd_jump", "./assets/audio/lompat.mp3");
    this.load.audio("snd_leveling", "./assets/audio/ganti_level.mp3");
    this.load.audio("snd_walk", "./assets/audio/jalan.mp3");
    this.load.audio("snd_touch", "./assets/audio/touch.mp3");
    this.load.audio("music_play", "./assets/audio/music_play.mp3");
    this.load.spritesheet("char", "assets/images/CharaSpriteAnim.png", {
      frameWidth: 44.8,
      frameHeight: 93,
    });
  },

  create: function () {
    //variabel untuk menentukan apabila game sudah dimulai atau belum
    this.gameStarted = false;
    
    //sound efek
    //menampung sound yang nanti dibunyikan ketika karakter menabrak koin
    this.snd_coin = this.sound.add("snd_coin");
    //menampung sound yang nanti dibunyikan ketika karakter melompat
    this.snd_jump = this.sound.add("snd_jump");
    //menampung sound yang nanti dibunyikan ketika terjadi pergantian level
    this.snd_leveling = this.sound.add("snd_leveling");
    //menampung sound yang nanti dibunyikan ketika karakter menabrak musuh
    this.snd_lose = this.sound.add("snd_lose");
    //menampung sound yang nanti dibunyikan ketika ada tombol yang ditekan
    this.snd_touch = this.sound.add("snd_touch");
    //sound karakter berjalan
    //menampung sound yang nanti dibunyikan ketika karakter bergerak
    this.snd_walk = this.sound.add("snd_walk");
    //membuat sound supaya bisa dimainkan secara terus menerus
    this.snd_walk.loop = true;
    //mengatur volume dari sound menjadi 0
    this.snd_walk.setVolume(0);
    //memainkan sound berjalan untuk pertama kali
    this.snd_walk.play();
    //musik
    //menampung musik yang nanti dibunyikan ketika tombol play ditekan
    this.music_play = this.sound.add("music_play");
    //membuat musik supaya bisa dimainkan secara terus menerus
    this.music_play.loop = true;

    // Inisialisasi posisi X dan Y
    X_POSITION = {
      LEFT: 0,
      CENTER: game.canvas.width / 2,
      RIGHT: game.canvas.width,
    };

    Y_POSITION = {
      TOP: 0,
      CENTER: game.canvas.height / 2,
      BOTTOM: game.canvas.height,
    };

    relativeSize = {
      w: (game.canvas.width - layoutSize.w) / 2,
      h: (game.canvas.height - layoutSize.h) / 2,
    };

    // Menambahkan background langit biru dan gunung ke tengah layar
    this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, "background");

    // FIXED: Membuat tampilan koin - diperbaiki dengan menyimpan referensi sebagai properti scene
    // Menambahkan panel koin
    this.coinPanel = this.add.image(X_POSITION.CENTER, 30, "coin_panel");
    this.coinPanel.setDepth(10);

    // Menambahkan teks jumlah koin - disimpan sebagai properti scene agar bisa diakses dari fungsi lain
    this.coinText = this.add.text(X_POSITION.CENTER, 30, "0", {
      fontFamily: "Verdana, Arial",
      fontSize: "37px",
      color: "#adadad",
    });
    this.coinText.setOrigin(0.5);
    this.coinText.setDepth(10);

    //membuat tampilan sebelum game dimulai
    //menambahkan lapisan gelap dengan menggunakan objek rectangle
    //(sebuah persegi dengan posisi, ukuran dan warna tertentu)
    var darkenLayer = this.add.rectangle(
      X_POSITION.CENTER,
      Y_POSITION.CENTER,
      game.canvas.width,
      game.canvas.height,
      0x000000
    );
    darkenLayer.setDepth(10);
    //mengatur tingkatan transparasi dari lapisan gelap menjadi 0.25 dari 1
    darkenLayer.alpha = 0.25;
    //menambahkan tampilan tombol play
    var buttonPlay = this.add.image(
      X_POSITION.CENTER,
      Y_POSITION.CENTER,
      "btn_play"
    );
    buttonPlay.setDepth(10);

    //membuat variabel untuk menampung sprite yang nantinya akan diambil datanya
    let groundTemp = this.add.image(0, 0, "ground").setVisible(false);
    //membuat variabel untuk menampung ukuran dari tiap gambar pijakan untuk
    //nantinya digunakan untuk membantu menentukan posisi-posisi dari tiap
    //pijakan yang akan ditambahkan ke dalam game
    let groundSize = { width: groundTemp.width, height: groundTemp.height };

    //membuat group physics yang nantinya akan digunakan untuk
    //menampung pijakan-pijakan yang tidak akan bisa bergerak
    var platforms = this.physics.add.staticGroup();
    this.platforms = platforms; // Store platforms reference in the scene

    //menambah sprite karakter dengan physics ke dalam game.
    this.player = this.physics.add.sprite(100, 500, "char");

    // FIXED: Set up player physics properly from the start
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Initially disable gravity until game starts
    this.physics.world.gravity.y = 800; // Set world gravity

    //menambahkan deteksi tubrukan antara karakter berdasarkan hukum
    //fisika dengan group pijakan (yang mewakili semua pijakan)
    this.physics.add.collider(this.player, platforms);

    //membuat objek partikel berdasarkan aset gambar yang sudah ada
    //kemudian menampungnya di dalam variabel 'partikelCoin'
    let partikelCoin = this.add.particles("coin");

    //menambahkan deteksi input tombol arah pada keyboard
    this.cursors = this.input.keyboard.createCursorKeys();

    //menambahkan animasi berlari dengan menghadap ke
    //arah kiri ke dalam game, dengan nama 'left'
    this.anims.create({
      //memberikan nama animasi dengan 'left'
      key: "left",
      //menentukan frame tampilan dari aset spritesheet bernama 'char',
      //dan dengan urutan bingkai gambar pertama sampai ke-empat
      frames: this.anims.generateFrameNumbers("char", { start: 0, end: 3 }),
      //menentukan kecepatan perpindahan tampilan dari bingkai 1 ke selanjutnya
      frameRate: 12,
      //menentukan animasi diulang terus-menerus (-1 untuk terus-menerus)
      repeat: -1,
    });

    //menambahkan animasi berlari dengan menghadap ke
    //arah kanan ke dalam game, dengan nama 'right'
    this.anims.create({
      //memberikan nama animasi dengan 'right'
      key: "right",
      //menentukan frame tampilan dari aset spritesheet bernama 'char',
      //dan dengan urutan bingkai gambar pertama sampai ke-empat
      frames: this.anims.generateFrameNumbers("char", { start: 5, end: 8 }),
      //menentukan kecepatan perpindahan tampilan dari bingkai 1 ke selanjutnya
      frameRate: 12,
      //menentukan animasi diulang terus-menerus (-1 untuk terus-menerus)
      repeat: -1,
    });

    //menambahkan animasi menghadap ke arah depan ke
    //arah game, dengan nama animasi 'front'
    this.anims.create({
      //memberi nama animasi dengan 'front'
      key: "front",
      //menentukan frame tampilan dari aset spritesheet bernama 'chara',
      //dan dengan urutan bingkai gambar ke 5 saja
      frames: [{ key: "char", frame: 4 }],
      //menentukan kecepatan perpindahan tampilan dari bingkai 1 ke selanjutnya
      frameRate: 20,
    });

    // FIXED: Create a 'turn' animation that was missing but referenced
    this.anims.create({
      key: "turn",
      frames: [{ key: "char", frame: 4 }],
      frameRate: 20,
    });

    //FIXED: membuat grup physics penampung sprite koin - disimpan sebagai properti scene
    this.coinsGroup = this.physics.add.group({
      //menentukan nama aset gambar yang akan ditambahkan sebagai sprite koin
      key: "coin",
      //menentukan jumlah pengulangan pembuatan koin (scr default dibuat 1)
      repeat: 9,
      //membuat setiap koin yang dibuat akan memantul dengan besaran toleransi acak
      setXY: { x: 60 + relativeSize.w, y: 100, stepX: 100 },
    });

    //membuat koin baru sekaligus membuat koin bisa memantul
    //berdasarkan elastisitas yang ditentukan secara acak
    this.coinsGroup.children.iterate(function (child) {
      //membuat setiap koin yang dibuat akan memantul dengan
      //toleransi yang diacak mulai dari 0.2 s/d 0.3
      child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.3));
    });

    //menambahkan deteksi tubrukan antara koin dengan
    //pijakan berdasarkan hukum fisika
    this.physics.add.collider(this.coinsGroup, platforms);

    //fungsi untuk menampilkan transisi jika sedang berganti level
    var newLevelTransition = function () {
      // Add level transition text using this.currentLevel instead of currentLevel
      var levelTransitionText = this.add.text(
        X_POSITION.CENTER,
        Y_POSITION.CENTER,
        "Level " + this.currentLevel,
        {
          fontFamily: "Verdana, Arial",
          fontSize: "40px",
          color: "#ffffff",
        }
      );
      levelTransitionText.setOrigin(0.5);
      levelTransitionText.setDepth(10);
      levelTransitionText.alpha = 0;

      // Animate text fade in/out
      this.tweens.add({
        targets: levelTransitionText,
        duration: 1000,
        alpha: 1,
        yoyo: true,
        onComplete: function () {
          levelTransitionText.destroy();
        },
      });

      // Animate darken layer fade out
      this.tweens.add({
        delay: 2000,
        targets: darkenLayer,
        duration: 250,
        alpha: 0,
        onComplete: () => {
          this.gameStarted = true;
          this.physics.resume();
        },
      });
    }.bind(this); // Bind this context to the function

    //FIXED: fungsi untuk mendeteksi ketika terjadi tubrukan antara koin dengan karakter
    var collectCoin = function (player, coin) {
      //menambahkan nilai sebanyak 10 koin baru ke dalam variabel 'countCoin'
      this.countCoin += 10;

      //FIXED: menampilkan jumlah koin pada teks dengan menggunakan this.coinText
      this.coinText.setText(this.countCoin);

      //memainkan sound efek koin ketika terjadi
      //tubrukan antara karakter dengan koin
      this.snd_coin.play();

      //menghentikan dan menonaktifkan body (physics) yang terdapat pada objek coin.
      //parameter 1, 'true' untuk menonaktifkan body (physics) yang terdapat pada objek
      //parameter 2, 'true' untuk menyembunyikan objek
      coin.disableBody(true, true);

      //FIXED: menggunakan this.coinsGroup untuk pengecekan koin aktif
      if (this.coinsGroup.countActive(true) === 0) {
        this.currentLevel++; // Increment level
        
        // Save checkpoint for current level (even beyond level 3)
        this.checkpoints[this.currentLevel] = {
            x: this.player.x,
            y: this.player.y,
        };
        
        // Always emit the level change event (remove the level 3 check)
        this.events.emit('levelChange');

        this.snd_walk.setVolume(0);
        this.gameStarted = false;
        this.physics.pause();
        this.player.anims.play("turn");
        //animasi untuk memunculkan background gelap-transparan dengan menggunakan tween
        this.tweens.add({
          targets: darkenLayer,
          duration: 250,
          alpha: 1,
          onComplete: function () {
            //memanggil fungsi untuk membuat tampilan
            //area bermain dengan level yang baru setelah
            //layar hitam terlihat
            prepareWorld();
            //memanggil fungsi untuk menjalankan
            //animasi transisi ketika level berganti
            newLevelTransition();
          },
        });
      }
    }.bind(this); // Bind this context to the function

    //FIXED: melakukan pengecekan jika karakter utama melewati objek koin menggunakan this.coinsGroup
    this.physics.add.overlap(this.player, this.coinsGroup, collectCoin, null, this);

    // Initially set the player to be static until game starts
    this.player.setVelocity(0, 0);
    this.player.anims.play("front");

    // FIXED: Create enemies group before it's first referenced
    var enemies = this.physics.add.group();

    // fungsi untuk membuat tampilan area bermain
    // berdasarkan level yang sedang aktif
    var prepareWorld = function () {
      platforms.clear(true, true);

      //membuat 9 buah pijakan yang tersusun rapi, letaknya berada di tepi bawah
      //dan menampungnya ke dalam variabel group penampung dengan nama 'platforms'
      platforms.create(
        X_POSITION.CENTER - groundSize.width * 4,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER - groundSize.width * 3,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER - groundSize.width * 2,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER - groundSize.width,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER + groundSize.width,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER + groundSize.width * 2,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER + groundSize.width * 3,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );
      platforms.create(
        X_POSITION.CENTER + groundSize.width * 4,
        Y_POSITION.BOTTOM - groundSize.height / 2,
        "ground"
      );

      // melakukan pengecekan jika level yang
      // sedang aktif adalah level "1"
      if (this.currentLevel == 1) {
        // membuat pijakan-pijakan tambahan yang posisinya tersebar di layar
        platforms.create(groundTemp.width / 2 + relativeSize.w, 384, "ground");
        platforms.create(400 + relativeSize.w, 424, "ground");
        platforms.create(
          1024 - groundTemp.width / 2 + relativeSize.w,
          480,
          "ground"
        );
        platforms.create(600 + relativeSize.w, 584, "ground");
      }

      //melakukan pengecekan jika level yang
      //sedang aktif adalah level "2"
      else if (this.currentLevel == 2) {
        //membuat pijakan-pijakan tambahan untuk level 2 yang posisinya tersebar di layar
        platforms.create(80 + relativeSize.w, 284, "ground");
        platforms.create(230 + relativeSize.w, 184, "ground");
        platforms.create(390 + relativeSize.w, 284, "ground");
        platforms.create(990 + relativeSize.w, 360, "ground");
        platforms.create(620 + relativeSize.w, 430, "ground");
        platforms.create(900 + relativeSize.w, 570, "ground");
      }

      //melakukan pengecekan jika level
      //sedang aktif adalah selain level "1" dan level "2"
      else {
        //membuat pijakan tambahan untuk level 3
        platforms.create(80 + relativeSize.w, 230, "ground");
        platforms.create(230 + relativeSize.w, 230, "ground");
        platforms.create(1040 + relativeSize.w, 280, "ground");
        platforms.create(600 + relativeSize.w, 340, "ground");
        platforms.create(400 + relativeSize.w, 420, "ground");
        platforms.create(930 + relativeSize.w, 430, "ground");
        platforms.create(820 + relativeSize.w, 570, "ground");
        platforms.create(512 + relativeSize.w, 590, "ground");
        platforms.create(0 + relativeSize.w, 570, "ground");
      }

      //FIXED: menampilkan koin baru menggunakan this.coinsGroup
      this.coinsGroup.children.iterate(function (child) {
        //membuat setiap koin yang dibuat akan memantul dengan
        //toleransi yang diacak mulai dari 0.2 - 0.3
        child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.3));
        //mengaktifkan hukum fisika pada koin supaya
        //dapat terkena efek gravitasi dan kemudian turun
        child.enableBody(true, child.x, -100, true, true);
      });
      
      //melakukan pengecekan terhadap level yang sedang aktif,
      //jika level lebih dari 3, maka akan muncul musuh
      //di setiap pertambahan levelnya
      if (this.currentLevel > 3) {
        //menentukan posisi horizontal (titik x) dari musuh yang akan muncul secara acak
        //dari titik 100 sampai di lebar layar dikurangi 100.
        var x = Phaser.Math.Between(100, game.canvas.width - 100);
        //membuat musuh baru yang akan muncul karena level lebih dari 3
        var enemy = enemies.create(
          x,
          -100,
          "enemy" + Phaser.Math.Between(1, 3)
        );
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        //memberikan nilai percepatan untuk membuat musuh langsung bergerak
        //secara acak ketika musuh muncul
        enemy.setVelocity(Phaser.Math.Between(-200, 200), 20);
        //membuat supaya efek gravitasi tidak berlaku pada sprite musuh,
        //sehingga bisa bergerak bebas seperti balon
        enemy.body.setAllowGravity(false);
      }
    }.bind(this); // Bind this context to the function

    // mempersiapkan area bermain untuk pertama kali dengan
    // memanggil fungsi 'prepareWorld'
    prepareWorld();

    //membuat setiap musuh yang ada di grup 'enemies'
    //bisa bertabrakan dengan setiap pijakan yang ada
    //di grup 'platform' berdasarkan hukum fisika
    this.physics.add.collider(enemies, platforms);

    //fungsi untuk mendeteksi ketika terjadi tubrukan antara musuh dengan karakter utama
    var hitEnemy = function (player, enemy) {
      // Stop physics and player movement
      this.physics.pause();
      this.gameStarted = false;

      // Play lose sound
      this.snd_lose.play();

      // Stop background music
      this.music_play.stop();

      // Turn player red
      player.setTint(0xff0000);

      // Show game over screen
      var gameOver = this.add.image(
        X_POSITION.CENTER,
        Y_POSITION.CENTER,
        "gameover"
      );
      gameOver.setDepth(20);

      // Add restart button
      var restartButton = this.add.text(
        X_POSITION.CENTER,
        Y_POSITION.CENTER + 100,
        "Click to Restart",
        {
          fontSize: "32px",
          fill: "#fff",
        }
      );
      restartButton.setOrigin(0.5);
      restartButton.setInteractive();
      restartButton.setDepth(20);

      // Restart from checkpoint when clicked
      restartButton.on("pointerdown", () => {
        // Get checkpoint for current level, fallback to initial position if undefined
        var checkpoint = this.checkpoints[this.currentLevel] || { x: 100, y: 500 };

        // Reset player position to checkpoint
        this.player.setPosition(checkpoint.x, checkpoint.y);
        this.player.clearTint();

        // Remove game over elements
        gameOver.destroy();
        restartButton.destroy();

        // Reset physics and game state
        this.gameStarted = true;
        this.physics.resume();

        // Restart music
        this.music_play.play();

        // Reset enemies positions
        enemies.children.iterate(function (enemy) {
          enemy.destroy(); // Remove existing enemies
        });

        // Recreate level
        prepareWorld.call(this);
      });
    }.bind(this); // Make sure to bind 'this' context

    //melakukan pengecekan jika karakter utama melewati objek musuh,
    //maka fungsi dengan nama 'hitEnemy' akan terpanggil
    this.physics.add.collider(this.player, enemies, hitEnemy, null, this);

    // FIXED: Add button interactivity that was missing
    buttonPlay.setInteractive({ useHandCursor: true });
    // Add hand cursor

    // Store scene reference
    var scene = this;

    buttonPlay.on("pointerdown", function () {
      this.setTint(0x5a5a5a); // Darken button when pressed
    });

    buttonPlay.on("pointerout", function () {
      this.clearTint(); // Remove tint when mouse leaves
    });

    buttonPlay.on("pointerup", function () {
      this.clearTint();

      // Play sounds
      scene.snd_touch.play();
      scene.music_play.play();

      // Animate button disappearing
      scene.tweens.add({
        targets: this,
        ease: "Back.in",
        scaleX: 0,
        scaleY: 0,
        duration: 250,
      });

      // Fade out darken layer
      scene.tweens.add({
        delay: 150,
        targets: darkenLayer,
        duration: 250,
        alpha: 0,
        onComplete: function () {
          scene.gameStarted = true;
          scene.physics.resume();
        },
      });
    });

    // Add checkpoint marker
    this.checkpointMarker = this.add.text(
      16,
      16,
      "Checkpoint: Level " + this.currentLevel,
      {
        fontSize: "24px",
        fill: "#fff",
      }
    );
    this.checkpointMarker.setDepth(10);
    this.checkpointMarker.setScrollFactor(0);

    // Update the checkpoint display when level changes
    this.events.on(
      "levelChange",
      function () {
        this.checkpointMarker.setText("Checkpoint: Level " + this.currentLevel);
      },
      this
    );

    // Initially pause physics
    this.physics.pause();
  },

  update: function () {
    //melakukan pengecekan apabila kondisi game
    //sudah dimulai atau belum sama sekali
    if (!this.gameStarted) {
      //apabila kondisi game belum dimulai, maka kode program
      //yang ada di bawahnya tidak akan dijalankan
      return;
    }

    //mendeteksi apabila tombol arah kanan
    //pada keyboard ditekan
    if (this.cursors.right.isDown) {
      //memberikan nilai percepatan dengan nilai '200' ke karakter utama
      //untuk menggerakkan karakter ke arah kanan dgn bantuan hukum fisika
      this.player.setVelocityX(200);

      //menganimasikan karakter berlari ke arah kanan
      this.player.anims.play("right", true);
      this.snd_walk.setVolume(1);
    } else if (this.cursors.left.isDown) {
      //memberikan nilai percepatan dengan nilai '-200' ke karakter utama
      //untuk menggerakkan karakter ke arah kiri dgn bantuan hukum fisika
      this.player.setVelocityX(-200);

      //menganimasikan karakter berlari ke arah kanan
      this.player.anims.play("left", true);
      this.snd_walk.setVolume(1);
    }
    //mendeteksi apabila tidak ada tombol arah
    //pada keyboard yang ditekan
    else {
      //memberikan nilai percepatan dengan nilai '0' ke karakter untuk
      //membuat karakter tidak bergerak dgn bantuan hukum fisika
      this.player.setVelocityX(0);

      //menganimasikan karakter untuk menghadap ke depan
      this.player.anims.play("front");
      this.snd_walk.setVolume(0);
    }
    //mendeteksi apabila tombol arah atas pada keyboard
    //ditekan dan kondisi untuk karakter sedang menyentuh pijakan
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      //memberikan nilai percepatan dengan nilai '-650' ke karakter utama
      //untuk menggerakkannya ke arah atas dgn bantuan hukum fisika (lompat)
      this.player.setVelocityY(-650);

      // Play jump sound
      this.snd_jump.play();
    }
  },
});