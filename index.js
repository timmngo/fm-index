const template = `
  <div id="app">

    <div id="controls">

      <h1>{{ mode !== 'search' ? 'Reverse BWT' : 'FM-Index: Backward Search' }} Visualizer</h1>
      <h4 @click="toggleMode"><a>Go to {{ mode === 'search' ? 'Reverse BWT' : 'FM-Index Backward Search' }} visualizer.</a></h4>

      <div style="display: flex; align-items; center; width: 18rem; justify-content: space-between;" >
        <label for="text">Text</label>
        <input name="text" type="text" maxlength="32" v-model="inputText"/>
      </div>
      
      <div v-show="mode === 'search'" style="display: flex; align-items: center; width: 18rem; margin-top: 0.5rem; justify-content: space-between;">
        <label for="query">Query</label>
        <input name="query" type="text" v-model="inputQuery"/>
      </div>

      <div style="display: flex; align-items: center; width: 18rem; margin-top: 0.5rem; justify-content: space-between;">
        <label for="show-matrix">Show BWT Matrix</label>
        <input name="show-matrix" type="checkbox" style="width: 2rem" v-model="showMatrix"/>
      </div>

      <div class="buttons" style="">
        <button @click="initializeSearch">Start</button>
        <button @click="resetSearch">Clear</button>
        <button @click="previousSearch" :disabled="!searchStarted || currentSearchState === 0">Previous Step</button>
        <button @click="advanceSearch" :disabled="!searchStarted">Next Step</button>
      </div>

      <div style="min-height: 9rem">
        <div style="margin-top: 1rem; width: 19rem;">{{ description }}</div>

        <div style="margin-top: 0.5rem">
          {{ nextStartEquation }}
        </div>

        <div v-show="mode === 'search'" style="margin-top: 0.5rem">
          {{ nextEndEquation }}
        </div>
      </div>

    </div>

    <div id="bwt" :class="{ 'hide-matrix': !showMatrix }">
      <div v-show="mode === 'search'" style="display: flex; flex-direction: row; margin-top: 0.5rem" :style="dynamicFontStyle" >
        <div class="string" style="display: flex; flex-direction: column" v-for="(letter, i) in searchText" >
          <div>{{ letter }}</div>
          <!--<div style="color: #aaa">{{ i }}</div>-->
        </div>
      </div>
      
      <div style="display: flex; flex-direction: row; margin-top: 0.5rem;" :style="dynamicFontStyle" >
        <div class="string" style="display: flex; flex-direction: column" v-for="(letter, i) in searchQuery" >
          <div :class="{active: search.i === i, green: search.i === i+1 && search.highlitIndices.length > 0, white: (search.i > i+1 && mode === 'bwt')}">{{ letter }}</div>
          <!--<div :class="{'active-index': search.i === i}">{{ i }}</div>-->
        </div>
      </div>
      <table>
      <thead>
        <tr :style="dynamicGridStyle">
          <th class="left-notes"></th>
          <th class="left-index"></th>
          <th class="cell" v-for="c, i in rotationsFiltered[0]">
            {{ (i == 0) ? 'F' : ''}}{{ (i === tableWidth - 1) ? 'L' : ''  }}
          </th>
        </tr>
      </thead>
      <tbody style="display: flex; flex-direction: column">
        
        <tr v-for="(r, i) in rotationsFiltered" :style="dynamicGridStyle">
          <td class="left-notes">
            <span class="index-label">{{ (i === search.sp && mode === 'search') ? 'start ' : '' }}</span>
            <span class="index-label">{{ (i === search.ep && mode === 'search') ? 'end ' : '' }}</span>
            <i v-show="(i===search.sp || i === search.ep) && mode === 'search'" class="material-icons">arrow_right_alt</i>
          </td>
          <td class="left-index">
            {{ i }}
          </td>
          <td 
            v-for="(c, j) in r" 
            class="cell"
            :class="{
              'match': search.i === 0 && i >= search.sp && i < search.ep && j < searchQuery.length,
              'f-column': j === 0, 'l-column': j === tableWidth - 1, 
              active: (i >= search.sp && i < search.ep && j === 0), 
              inactive: !(j === 0 || j === tableWidth-1), 
              green: (j === tableWidth-1 && search.highlitIndices.includes(i)),
              'border-top': (i === search.sp || i === search.ep),
              'border-right': (i >= search.sp && i < search.ep && j === tableWidth - 1),
              'border-left': (i >= search.sp && i < search.ep && j === 0),
            }"
          >
            {{ c }}<sub v-show="j === 0">{{ counts[c] !== undefined ? i - counts[c] : "" }}</sub><sub v-show="j === tableWidth-1">{{ occurrences[c] !== undefined ? occurrences[c][i] : "" }}</sub>
          </td>
          <td class="right-notes">
            {{ (i === search.sp && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0) ? "Occ(\'" + searchQuery[search.i-1] + "\', " + i + ') = ' + occurrences[searchQuery[search.i-1]][i]  : '' }}
            {{ (i === search.ep && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0 && mode === 'search') ? "Occ(\'" + searchQuery[search.i-1] + "\', " + i + ') = ' + occurrences[searchQuery[search.i-1]][i]  : '' }}
          </td>
        </tr>

        <tr :style="dynamicGridStyle">
          <td class="left-notes">
            {{ (search.ep === bwt.length && mode === 'search') ? 'end' : '' }}
            <i v-show="search.ep === bwt.length && mode === 'search'" class="material-icons">arrow_right_alt</i>
          </td>
          <td class="left-index"></td>
          <td class="cell" :class="{'border-top': (search.ep === bwt.length)}" v-for="c, i in rotations[0]"></td>
          <td class="right-notes">
            {{ (search.ep === tableWidth && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0 && mode === 'search') ? 'Occ(' + searchQuery[search.i-1] + ', ' + search.ep + ') = ' + occurrences[searchQuery[search.i-1]][search.ep]  : '' }}
          </td>
        </tr>

      </tbody>

      </table>


    </div>
    

    <!--<div style="margin-top: 0.5rem">{{ bwt }}</div>-->
    <!--<div style="margin-top: 0.5rem">{{ encodeMtf(bwt) }}</div>-->

    

    <!--<div>Character: {{ search.c }}</div>
    <div>Query index: {{ search.i }}</div>
    <div>Start index: {{ search.sp }}</div>
    <div>End index: {{ search.ep }}</div>-->
    
  </div>
`

let app = new Vue({
  el: '#app',
  data: {
    inputQuery: "abra",
    inputText: "abracadabra",
    testStr: "bananabandanabandanabaaann",
    testStr2: "bananabnaaaaaa",
    counts: {},
    occurrences: {},
    alphabet: "",
    alphabetMap: {},
    searchHistory: [{
      c: null,
      i: null,
      sp: null,
      ep: null,
      state: 0,
      highlitIndices: [],
    },],
    currentSearchState: 0,
    searchStarted: false,
    showMatrix: true,
    mode: "bwt",
  },
  watch: {
    inputText() {
      this.resetSearch();
    },
    searchQuery() {
      this.resetSearch();
    }
  },
  computed: {
    search() {
      return this.searchHistory[this.currentSearchState];
    },
    searchQuery() {
      return (this.mode === 'bwt') ? this.searchText : this.inputQuery;
    },
    searchText() {
      return this.inputText + "$";
    },
    rotations() {
      let n = this.searchText.length;
      let arr = new Array(n);
      let double = this.searchText + this.searchText;
      for (let i = 0; i < n; i++) {
        arr[i] = double.substr(i, n);
      }
      return arr.sort();
    },
    rotationsFiltered() {
      if (this.showMatrix) {
        return this.rotations;
      } else {
        return this.rotations.map(r => r[0] + r[r.length-1]);
      }
    },
    sa() {
      return this.rotations.map(x => x[0]).join("")
    },
    bwt() {
      return this.rotations.map(x => x[x.length-1]).join("")
    },
    description() {
      const { c, i, sp, ep } = this.search;
      let desc = "";
      if (c === null) {
        return desc;
      }
      if (c !== null && ep === undefined) {
        return `The character '${c}' was not found. No matches were found. ` 
      }
      if (ep >= sp) {
        desc += `The character '${c}' is found in the first column using index mapping. ` 
      } else {
        return `The character '${c}' was not found. No matches were found. ` 
      }
      if (this.search.i > 0) {
        desc += `The next character to search for in L is '${this.searchQuery[i-1]}'. `;
      } else if ((ep - sp > 1 || ep - sp === 0) && this.mode === 'search') {
        desc += `The search is complete. ${ep - sp} matches were found. `
      } else if (ep - sp === 1 && this.mode === 'search') {
        desc += `The search is complete. ${ep - sp} match was found. `
      }
      return desc;
      
    },
    nextStartEquation() {
      const { c, i, sp, ep } = this.search;
      if (c === null || i === 0 || this.counts[c] === undefined) {
        return '';
      }
      let cNext = this.searchQuery[i-1];
      if (this.counts[cNext] !== undefined) {
        return `Next ${this.mode === 'search' ? 'start ' : '' }index = C('${cNext}') + Occ('${cNext}',${sp}) = ${this.counts[cNext] + this.occurrences[cNext][sp]}`;
      }
    },
    nextEndEquation() {
      const { c, i, sp, ep } = this.search;
      if (c === null || i === 0 || this.counts[c] === undefined) {
        return '';
      }
      let cNext = this.searchQuery[i-1];
      if (this.counts[cNext] !== undefined) {
        return `Next end index = C('${cNext}') + Occ('${cNext}',${ep}) = ${this.counts[cNext] + this.occurrences[cNext][ep]}`;
      }
    },
    dynamicFontStyle() {
      return {
        fontSize: this.tableWidth < 14 ? '18px' : `calc(18px  - 3 * ((${this.tableWidth}px - 14px) / 18))` ,
      }
    },
    dynamicGridStyle() {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${this.tableWidth + 3}, minmax(0.5rem, 2rem))`,
        fontSize: `calc(14px + 4 * ((100vw - 320px) / 680) - 3 * ((${this.tableWidth}px - 14px) / 18))` ,
      };
    },
    tableWidth() {
      return this.rotationsFiltered[0].length;
    }
  },
  created() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('m');
    this.mode = mode ? mode : 'search';
  },
  mounted() {
  },
  methods: {
    encodeMtf(word) {
      let alphabet = this.alphabet.split('');
      let init = {wordAsNumbers: [], charList: alphabet};
     
      return word.split('').reduce(function (acc, char) {
        let charNum = acc.charList.indexOf(char); //get index of char
        acc.wordAsNumbers.push(charNum); //add original index to acc
        acc.charList.unshift(acc.charList.splice(charNum, 1)[0]); //put at beginning of list
        return acc;
      }, init).wordAsNumbers; //return number list
    },
     
    decodeMtf(numList) {
      let alphabet = this.alphabet.split('');
      let init = {word: '', charList: alphabet};
     
      return numList.reduce(function (acc, num) {
        acc.word += acc.charList[num];
        acc.charList.unshift(acc.charList.splice(num, 1)[0]); //put at beginning of list
        return acc;
      }, init).word;
    },
    computeAlphabet() {
      this.alphabet = [...new Set(this.searchText)].sort().join('');
      for (let i = 0; i < this.alphabet.length; i++) {
        this.alphabetMap[this.alphabet[i]] = i;
      }
    },

    computeCountsOccurences() {
      this.resetSearch();
      for (let i = 0; i < this.sa.length; i++) {
        if (!this.counts.hasOwnProperty(this.sa[i])) {
          this.counts[this.sa[i]] = i;
        }
      }
      this.computeAlphabet();
      
      for (let i = 0; i < this.alphabet.length; i++) {
        this.occurrences[this.alphabet[i]] = [0];
      }
      for (let i = 1; i < this.bwt.length+1; i++) {
        let c = this.bwt[i-1];
        for (let j = 0; j < this.alphabet.length; j++) {
          if (c === this.alphabet[j]) {
            this.occurrences[c].push(this.occurrences[c][i-1] + 1)
          } else {
            this.occurrences[this.alphabet[j]].push(this.occurrences[this.alphabet[j]][i-1])
          }
        }
      }
    },

    initializeSearch() {

      if (this.searchQuery.length === 0 || this.inputText.length === 0 || this.searchQuery.length > this.searchText.length) {
        return;
      }
      this.computeCountsOccurences();
      this.searchStarted = true;
      let p = this.searchQuery;
      let i = p.length - 1;
      let c = p[i];
      let sp = this.counts[c];
      let ep = (this.alphabetMap[c]+1 >= this.alphabet.length) 
        ? this.bwt.length - 1 
        : this.counts[this.alphabet[this.alphabetMap[c]+1]];

      this.searchHistory = [];

      let highlitIndices = [];
      for (let k = sp; k < ep; k++) {
        if (this.bwt[k] === this.searchQuery[i - 1]) {
          highlitIndices.push(k);
        }
      }

      this.searchHistory.push({
        c: c,
        i: i,
        sp: sp,
        ep: ep,
        highlitIndices: highlitIndices,
      });

      this.currentSearchState = 0;

    },

    advanceSearch() {

      let { i, sp, ep } = this.search;

      if (sp <= ep && i >= 1 && (this.currentSearchState === this.searchHistory.length - 1)) {
        let c = this.searchQuery[i - 1];
        i = i - 1;

        if (this.occurrences[c] === undefined) {
          this.searchHistory.push({
            c: c,
            i: i,
            sp: undefined,
            ep: undefined,
            highlitIndices: [],
          });
          this.currentSearchState++;
          return;
        }

        sp = this.counts[c] + this.occurrences[c][sp];
        ep = this.counts[c] + this.occurrences[c][ep];


        let highlitIndices = [];
        if (i > 0) {
          for (let k = sp; k < ep; k++) {
            if (this.bwt[k] === this.searchQuery[i-1]) {
              highlitIndices.push(k);
            }
          }
        }

        this.searchHistory.push({
          c: c,
          i: i,
          sp: sp,
          ep: ep,
          highlitIndices: highlitIndices,
        });
        this.currentSearchState++;

      } else if (this.currentSearchState < this.searchHistory.length - 1) {
        this.currentSearchState++;
      }


    },

    previousSearch() {
      if (this.currentSearchState > 0) {
        this.currentSearchState--;
      }
    },

    resetSearch() {
      this.searchStarted = false;
      this.counts = {};
      this.occurrences = {};
      this.searchHistory = [{
        c: null,
        i: null,
        sp: null,
        ep: null,
        state: 0,
        highlitIndices: [],
      }];
      this.currentSearchState = 0;
    },

    toggleMode() {
      this.resetSearch();
      if (this.mode === 'search') {
        this.mode = 'bwt';
      } else {
        this.mode = 'search';
      }
    },

  },
  template: template,
});