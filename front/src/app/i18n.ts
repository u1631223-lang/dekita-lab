import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ja: {
    translation: {
      hub: {
        welcome: 'きょうは どの ゲームで あそぶ？',
        rhythm: 'リズムタップ',
        memory: 'ペアペアワールド',
        concentration: 'しんけいすいじゃく',
        sequence: 'キラキラパターン',
        shape: 'かたちビルダー',
        cardSprint: 'カードスプリント',
        oldMaid: 'ババぬき',
        shichiNarabe: 'しちならべ',
        comingSoon: 'じゅんびちゅう',
        settingsButton: 'ほごしゃせってい',
        difficulty: {
          lv1: 'Lv1',
          lv2: 'Lv2',
          lv3: 'Lv3',
          lv4: 'Lv4'
        }
      },
      actions: {
        start: 'スタート',
        back: 'もどる'
      },
      reward: {
        goodJob: 'じょうずにできたね！',
        nice: 'いい ちょうせん！',
        amazing: 'すっごい！',
        super: 'スーパーコンボ！',
        keepGoing: 'そのちょうし！'
      },
      rhythm: {
        listen: 'リズムをきこう',
        tap: 'まねしてタップ！',
        tryAgain: 'もういっかい！',
        hint: 'ヒント'
      },
      sequence: {
        listen: 'ひかりを みてね',
        replay: 'おぼえた とおりに タッチ！',
        tryAgain: 'もう いちど！',
        stageClear: 'できた！つぎの レベルへ'
      },
      pair: {
        goal: 'おなじ えを そろえよう！',
        mistakes: 'まちがい'
      },
      concentration: {
        goal: 'おなじ ランクを そろえよう！',
        remaining: 'のこりのペア',
        pairs: '{{found}} / {{total}} ペア',
        mistakes: 'まちがい',
        hint: 'ヒント',
        suits: {
          hearts: 'ハート',
          diamonds: 'ダイヤ',
          clubs: 'クラブ',
          spades: 'スペード'
        },
        cardLabel: '{{rank}}の{{suit}}'
      },
      shape: {
        target: 'つぎは この かたち！'
      },
      oldMaid: {
        goal: 'ババを だれかに わたそう！',
        hint: 'ヒント',
        jokerWarning: 'ババが まぎれているかも…',
        victory: 'ばっちり！ ジョーカーを にがしたよ！',
        defeat: 'ババが のこっちゃった… つぎは うまく かわそう！',
        turn: '{{name}} の ばんだよ',
        encore: 'きょうも じょうずに やってみよう！',
        pairs: 'そろったペア {{count}}',
        yourHand: 'あなたの てふだ',
        handEmpty: 'カードは もう ないみたい！',
        waiting: 'つぎの あいてを まっているよ…',
        pickFrom: '{{name}} から 1まい えらぼう',
        drawCard: 'カードを ひく',
        ai: {
          sunny: 'たいようちゃん',
          moon: 'つきくん',
          comet: 'ほしずきん',
          rival: 'ライバル'
        },
        player: {
          you: 'あなた'
        }
      },
      shichiNarabe: {
        goal: '7を だして ならべよう！',
        passesLeft: 'のこりパス {{count}} かい',
        handCount: 'てふだ {{count}} まい',
        hint: 'ヒント',
        pass: 'パス',
        passLimit: 'もう パスできないよ',
        noMoves: 'ならべられるカードが ないよ',
        needAdjacent: '7の となりだけ ならべられるよ',
        played: '{{name}} が {{suit}}{{card}} を ならべたよ',
        passAnnouncement: '{{name}} は パス！ のこり {{remaining}} かい',
        turnPlayer: 'あなたの ばんだよ',
        turnAi: '{{name}} の ばんだよ',
        victory: 'ぜんぶ ならべたよ！',
        defeat: 'ざんねん！ まだ カードが のこったよ',
        loading: 'ラウンドを よみこみちゅうです…',
        field: 'ばのカード',
        opponents: 'あいてのじょうほう',
        passesUsed: 'パス {{count}} かい',
        finished: 'あがったよ！',
        out: 'パスが いっぱい',
        yourHand: 'あなたの てふだ',
        emptyHand: 'カードは もう ないよ！',
        cardLabel: '{{suit}}{{rank}}',
        suits: {
          spade: '♠ スペード',
          heart: '♥ ハート',
          diamond: '♦ ダイヤ',
          club: '♣ クラブ'
        },
        player: {
          you: 'あなた'
        },
        ai: {
          kai: 'カイ',
          mio: 'ミオ',
          ren: 'レン',
          haru: 'ハル',
          aki: 'アキ',
          suzu: 'スズ'
        }
      },
      summary: {
        title: 'きょうの できた！',
        successRate: 'せいこうりつ',
        averageReaction: 'へんとうじかん',
        bestStreak: 'れんしょう',
        backToHub: 'つぎも がんばる！'
      },
      hud: {
        success: 'せいこうりつ',
        streak: 'れんしょう',
        reaction: 'へんとうじかん',
        nextGoal: 'つぎのごほうびまで',
        goalAchieved: 'ぜんぶ あつまったよ！'
      },
      timer: {
        label: 'プレイじかん',
        reminder: 'そろそろ きゅうけい しよう'
      },
      onboarding: {
        title: 'ごほうび と おと の せってい',
        description: 'みみにやさしいおとや スペシャルえんしゅつの つよさを ここで えらべます。',
        caregiverNote: '※ ほごしゃのかたが チェックしてください',
        finish: 'はじめる',
        rewards: {
          title: 'ごほうび の きせい',
          volume: 'おと',
          sound: 'おとを ならす',
          celebration: 'スペシャルえんしゅつを つかう'
        },
        reset: 'きろくを リセット'
      },
      worldProgress: {
        title: 'きょうの ぼうけん',
        subtitle: 'スターを あつめて せかいを ひろげよう',
        totalStars: 'ぜんぶで {{count}} こ',
        starUnit: 'スター'
      },
      celebration: {
        milestone: '{{value}}こ の スターを あつめたよ！',
        total: 'ぜんぶで {{stars}}こ'
      },
      caregiverGate: {
        title: 'ほごしゃの かたに かくにん',
        prompt: '{{a}} + {{b}} = ?',
        error: 'こたえが まちがっています',
        cancel: 'キャンセル',
        confirm: 'OK'
      }
    }
  },
  en: {
    translation: {
      hub: {
        welcome: 'What shall we play today?',
        rhythm: 'Rhythm Tap',
        memory: 'Pair Match World',
        concentration: 'Concentration',
        sequence: 'Sequence Spark',
        shape: 'Shape Builder',
        cardSprint: 'Card Sprint',
        oldMaid: 'Old Maid',
        shichiNarabe: 'Seven Sevens',
        comingSoon: 'Coming soon',
        settingsButton: 'Caregiver settings',
        difficulty: {
          lv1: 'Lv1',
          lv2: 'Lv2',
          lv3: 'Lv3',
          lv4: 'Lv4'
        }
      },
      actions: {
        start: 'Start',
        back: 'Back'
      },
      reward: {
        goodJob: 'Great job!',
        nice: 'Nice effort!',
        amazing: 'Amazing!',
        super: 'Super combo!',
        keepGoing: 'Keep going!'
      },
      rhythm: {
        listen: 'Listen closely',
        tap: 'Tap the pattern!',
        tryAgain: 'Try again!',
        hint: 'Hint'
      },
      sequence: {
        listen: 'Watch the sparks',
        replay: 'Tap the pads in order!',
        tryAgain: 'Try once more!',
        stageClear: 'Stage clear! Rising difficulty!'
      },
      pair: {
        goal: 'Match the pairs!',
        mistakes: 'Mistakes'
      },
      concentration: {
        goal: 'Match the ranks!',
        remaining: 'Pairs left',
        pairs: '{{found}} / {{total}} pairs',
        mistakes: 'Misses',
        hint: 'Hint',
        suits: {
          hearts: 'hearts',
          diamonds: 'diamonds',
          clubs: 'clubs',
          spades: 'spades'
        },
        cardLabel: '{{rank}} of {{suit}}'
      },
      shape: {
        target: 'Place this shape next!'
      },
      shichiNarabe: {
        goal: 'Play cards around the sevens!',
        passesLeft: '{{count}} passes left',
        handCount: '{{count}} cards in hand',
        hint: 'Hint',
        pass: 'Pass',
        passLimit: 'No passes remaining',
        noMoves: 'No playable cards right now',
        needAdjacent: 'Place cards next to each suit\'s seven.',
        played: '{{name}} played {{suit}}{{card}}',
        passAnnouncement: '{{name}} passed ({{remaining}} left).',
        turnPlayer: 'Your turn',
        turnAi: "It is {{name}}'s turn",
        victory: 'Wonderful! You placed every card.',
        defeat: 'Cards remain in your hand - try again!',
        loading: 'Loading the round…',
        field: 'Field cards',
        opponents: 'Opponents',
        passesUsed: '{{count}} passes used',
        finished: 'Finished!',
        out: 'Out of passes',
        yourHand: 'Your hand',
        emptyHand: 'No cards remaining!',
        cardLabel: '{{suit}}{{rank}}',
        suits: {
          spade: 'Spade suit',
          heart: 'Heart suit',
          diamond: 'Diamond suit',
          club: 'Club suit'
        },
        player: {
          you: 'You'
        },
        ai: {
          kai: 'Kai',
          mio: 'Mio',
          ren: 'Ren',
          haru: 'Haru',
          aki: 'Aki',
          suzu: 'Suzu'
        }
      },
      summary: {
        title: 'Today’s Wins',
        successRate: 'Success rate',
        averageReaction: 'Avg reaction time',
        bestStreak: 'Best streak',
        backToHub: 'Play again'
      },
      hud: {
        success: 'Success',
        streak: 'Best streak',
        reaction: 'Reaction',
        nextGoal: 'To next reward',
        goalAchieved: 'All goals achieved!'
      },
      timer: {
        label: 'Play time',
        reminder: 'Time for a short break!'
      },
      onboarding: {
        title: 'Reward & sound preferences',
        description: 'Adjust how lively the feedback feels before you start.',
        caregiverNote: 'Caregivers only: set a comfortable experience for your child.',
        finish: 'Let’s go',
        rewards: {
          title: 'Reward preferences',
          volume: 'Volume',
          sound: 'Play sounds',
          celebration: 'Enable celebration effects'
        },
        reset: 'Reset progress'
      },
      worldProgress: {
        title: 'Today’s Adventure',
        subtitle: 'Collect stars to expand your world',
        totalStars: '{{count}} stars gathered',
        starUnit: 'stars'
      },
      celebration: {
        milestone: 'Unlocked at {{value}} stars!',
        total: 'Total {{stars}} stars'
      },
      caregiverGate: {
        title: 'Caregiver check',
        prompt: '{{a}} + {{b}} = ?',
        error: 'That answer is not quite right.',
        cancel: 'Cancel',
        confirm: 'Unlock'
      }
    }
  }
};

i18next.use(initReactI18next).init({
  resources,
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false
  }
});

export const i18n = i18next;
