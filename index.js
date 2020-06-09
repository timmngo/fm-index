const template = `
  <div id="app">
    <h1>FM-Index: Backward Search Visualizer</h1>
    
    <div style="display: flex; flex-direction: row">
      <div class="string" style="display: flex; flex-direction: column" v-for="(letter, i) in searchText" >
        <div>{{ letter }}</div>
        <div>{{ i }}</div>
      </div>
    </div>
    
    <div style="display: flex; flex-direction: row; margin-top: 0.5rem;">
      <div class="string" style="display: flex; flex-direction: column" v-for="(letter, i) in searchQuery" >
        <div :class="{active: search.i === i, green: search.i === i+1 && search.highlitIndices.length > 0}">{{ letter }}</div>
        <div :class="{'active-index': search.i === i}">{{ i }}</div>
      </div>
    </div>


    <table>
    <thead>
      <tr>
        <th class="left-notes"></th>
        <th class="left-index"></th>
        <th class="cell" v-for="c, i in rotations[0]">{{ (i == 0) ? 'F' : ''}}{{ (i === bwt.length - 1) ? 'L' : ''  }}</th>
      </tr>
    </thead>
    <tbody style="display: flex; flex-direction: column">
      
      <tr v-for="(r, i) in rotations" 
      >
        <td 
          class="left-notes"
        >{{ (i === search.sp) ? 'start' : '' }}{{ (i === search.ep) ? 'end' : '' }}</td>
        <td 
          class="left-index"
        >{{ i }}</td>
        <td 
          v-for="(c, j) in r" 
          class="cell"
          :style="{ 
            'border-top': (i === search.sp) ? 'solid #333 1px' : 'solid #0000 1px',
            'border-bottom': (i === search.ep-1) ? 'solid #333 1px' : 'solid #0000 1px',
            'border-left': (i >= search.sp && i < search.ep && j === 0) ? 'solid #333 1px' : 'solid #0000 1px',
            'border-right': (i >= search.sp && i < search.ep && j === bwt.length - 1) ? 'solid #333 1px' : 'solid #0000 1px',
          }"
          :class="{inactive: !(j === 0 || j === searchText.length - 1), active: (i >= search.sp && i < search.ep && j === 0), green: (j === bwt.length-1 && search.highlitIndices.includes(i))}"
        >{{ c }}<sub v-show="j === 0">{{ counts[c] !== undefined ? i - counts[c] : "" }}</sub><sub v-show="j === bwt.length-1">{{ occurrences[c] !== undefined ? occurrences[c][i] : "" }}</sub>
          </td>
          <td 
            class="right-notes"
          >
          {{ (i === search.sp && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0) ? 'Occ(' + searchQuery[search.i-1] + ', ' + i + ') = ' + occurrences[searchQuery[search.i-1]][i-1]  : '' }}
          {{ (i === search.ep && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0) ? 'Occ(' + searchQuery[search.i-1] + ', ' + i + ') = ' + occurrences[searchQuery[search.i-1]][i]  : '' }}
          </td>
      </tr>
      <tr>
        <td 
          class="left-notes"
        >{{ (search.ep === bwt.length) ? 'end' : '' }}</td>
        <td 
          class="left-index"
        ></td>
        <td class="cell" v-for="c, i in rotations[0]"></td>
        <td 
          class="right-notes"  
        >{{ (search.ep === bwt.length && occurrences[searchQuery[search.i-1]] !== undefined && search.i > 0) ? 'Occ(' + searchQuery[search.i-1] + ', ' + search.ep + ') = ' + occurrences[searchQuery[search.i-1]][search.ep]  : '' }}</td>
      </tr>
    </tbody>

    </table>

    <div style="width: 19rem; height: 7rem;">{{ description }}</div>

    
    

    <!--<div style="margin-top: 0.5rem">{{ bwt }}</div>-->
    <!--<div style="margin-top: 0.5rem">{{ encodeMtf(bwt) }}</div>-->

    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="display: flex; align-items; center; width: 14rem; margin-top: 1rem; justify-content: space-between;">
        <label for="text">Text</label>
        <input name="text" type="text" v-model="inputText"/>
      </div>
      
      <div style="display: flex; align-items: center; width: 14rem; margin-top: 1rem; justify-content: space-between;">
        <label for="query">Query</label>
        <input name="query" type="text" v-model="searchQuery"/>
      </div>
      <div style="display: flex; margin-top: 1rem;">
      <button @click="initializeSearch">Start Search</button>
      <button @click="previousSearch" :disabled="!searchStarted">Previous Step</button>
      <button @click="advanceSearch" :disabled="!searchStarted">Next Step</button>
      <button @click="resetSearch">Clear</button>
      </div>
    </div>

    <!--<div>Character: {{ search.c }}</div>
    <div>Query index: {{ search.i }}</div>
    <div>Start index: {{ search.sp }}</div>
    <div>End index: {{ search.ep }}</div>-->
    
  </div>
`

let app = new Vue({
  el: '#app',
  data: {
    searchQuery: "abra",
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
        return `The character '${this.search.c}' was not found. No matches were found. ` 
      }
      if (ep >= sp) {
        desc += `The character '${this.search.c}' is found in the first column using index mapping. ` 
      } else {
        return `The character '${this.search.c}' was not found. No matches were found. ` 
      }
      if (this.search.i > 0) {
        desc += `The next character to search in the right column for is '${this.searchQuery[this.search.i-1]}'. `;
      } else if (ep - sp > 1 || ep - sp === 0) {
        desc += `The search is complete. ${this.search.ep - this.search.sp} matches were found. `
      } else if (ep - sp === 1) {
        desc += `The search is complete. ${ep - sp} match was found. `
      }
      return desc;
      
    },
  },
  created() {

  },
  mounted() {

  },
  methods: {
    encodeMtf(word) {
      let init = {wordAsNumbers: [], charList: 'abcdefghijklmnopqrstuvwxyz'.split('')};
     
      return word.split('').reduce(function (acc, char) {
        let charNum = acc.charList.indexOf(char); //get index of char
        acc.wordAsNumbers.push(charNum); //add original index to acc
        acc.charList.unshift(acc.charList.splice(charNum, 1)[0]); //put at beginning of list
        return acc;
      }, init).wordAsNumbers; //return number list
    },
     
    decodeMtf(numList) {
      let init = {word: '', charList: 'abcdefghijklmnopqrstuvwxyz'.split('')};
     
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

      if (this.searchQuery.length === 0 || this.inputText.length === 0) {
        return;
      }
      this.computeCountsOccurences();
      this.searchStarted = true;
      let p = this.searchQuery;
      let i = p.length - 1;
      let c = p[i];
      let sp = this.counts[c];
      let ep = (this.alphabetMap[c]+1 > this.alphabet.length) 
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

  },
  template: template,
});