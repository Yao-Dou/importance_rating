const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 0,
            hits_data: {},

            showCount: 4,
            allResultsShown: false,

            responseIsVisible: false,
            responseToggleText: 'Thought process...',
            searchableIsVisible: false,
            searchableToggleText: 'Thought process...',
            snippetIsVisible: false,
            snippetToggleText: 'Thought process...',

            googleQueryAnswer: null,
            correctedQuery: null,
            aiEstimation: null,
            finalEstimation: null,
            estConfidence: null,
            referenceLinks: [],
            nextLinkId: 0, // increment this each time you add a link
            briefExplanation: '',

            showCheckmark: false,
        }
    },
    methods: {
        toggleContent(type) {
            let isVisible, ref, toggleText;
            switch (type) {
                case 'response':
                    this.responseIsVisible = !this.responseIsVisible;
                    isVisible = this.responseIsVisible;
                    ref = 'responseContentDiv';
                    toggleText = 'responseToggleText';
                    break;
                case 'searchable':
                    this.searchableIsVisible = !this.searchableIsVisible;
                    isVisible = this.searchableIsVisible;
                    ref = 'searchableContentDiv';
                    toggleText = 'searchableToggleText';
                    break;
                case 'snippet':
                    this.snippetIsVisible = !this.snippetIsVisible;
                    isVisible = this.snippetIsVisible;
                    ref = 'snippetContentDiv';
                    toggleText = 'snippetToggleText';
                    break;
            }
            this.toggle(isVisible, ref, toggleText);
        },
        toggle(isVisible, ref, toggleText) {
            const targetDiv = this.$refs[ref];
            if (isVisible) {
                $(targetDiv).slideDown();
                this[toggleText] = 'Collapse';
            } else {
                $(targetDiv).slideUp();
                this[toggleText] = 'Thought process...';
            }
        },
        loadMore() {
            this.showCount += 4;
        },
        toggleResults() {
            if (this.allResultsShown) {
              this.showCount = 4;
              this.allResultsShown = false;
            } else {
              this.showCount = this.hits_data[this.current_hit_id].search_results.length;
              this.allResultsShown = true;
            }
        },
        addLinkInput() {
            this.referenceLinks.push({id: this.nextLinkId++, value: ''});
        },
        removeLinkInput(idToRemove) {
            this.referenceLinks = this.referenceLinks.filter(linkObj => linkObj.id !== idToRemove);
        },
        saveAnnotations() {
            // Initialize the annotations dictionary if it doesn't exist
            if (!this.hits_data[this.current_hit_id].annotations) {
                this.$set(this.hits_data[this.current_hit_id], 'annotations', {});
            }
    
            // Populate the annotations dictionary with the form data
            const annotations = {
                googleQueryAnswer: this.googleQueryAnswer,
                correctedQuery: this.correctedQuery,
                aiEstimation: this.aiEstimation,
                finalEstimation: this.finalEstimation,
                estConfidence: this.estConfidence,
                referenceLinks: this.referenceLinks,
                briefExplanation: this.briefExplanation,
            };
            
            this.hits_data[this.current_hit_id].annotations = annotations;

            this.showCheckmark = true;
            setTimeout(() => {
            this.showCheckmark = false;
            }, 2000); // 2000ms matches the animation duration

            let urlParams = new URLSearchParams(window.location.search);
            let data_path = urlParams.get('data');
            let annotator_name = urlParams.get('name')

            localStorage.setItem(`hits_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
        },
        go_to_hit(hit_num) {
            if (hit_num > this.total_hits - 1) {
                hit_num = this.total_hits - 1;
            } else if (hit_num < 0) {
                hit_num = 0;
            }
            this.current_hit = hit_num;

            // Load annotations for the current hit
            const annotations = this.hits_data[this.current_hit_id].annotations;

            this.googleQueryAnswer = annotations.googleQueryAnswer || null;
            this.correctedQuery = annotations.correctedQuery || null;
            this.aiEstimation = annotations.aiEstimation || null;
            this.finalEstimation = annotations.finalEstimation || null;
            this.estConfidence = annotations.estConfidence || null;
            this.referenceLinks = annotations.referenceLinks || [];
            this.briefExplanation = annotations.briefExplanation || '';
        },
        go_to_hit_circle(hit_num, event) {
            this.go_to_hit(hit_num);
        },
        refreshVariables() {
            this.total_hits = Object.keys(this.hits_data).length;
            this.hits_ids = Object.keys(this.hits_data);
            // hits_ids to int
            this.hits_ids = this.hits_ids.map(Number);
            // sort hits_ids from low to high
            this.hits_ids.sort(function(a, b){return a-b});
            this.current_hit = 0;
    
            const annotations = this.hits_data[this.current_hit_id].annotations || {};
            this.googleQueryAnswer = annotations.googleQueryAnswer || null;
            this.correctedQuery = annotations.correctedQuery || null;
            this.aiEstimation = annotations.aiEstimation || null;
            this.finalEstimation = annotations.finalEstimation || null;
            this.estConfidence = annotations.estConfidence || null;
            this.referenceLinks = annotations.referenceLinks || [];
            this.briefExplanation = annotations.briefExplanation || '';
        },
        handle_file_upload(event) {
            const file = event.target.files[0];
            if (file && file.type === "application/json") {
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        // You can do further validations here, if needed
                        this.hits_data = jsonData;
        
                        let urlParams = new URLSearchParams(window.location.search);
                        let annotator_name = urlParams.get('name')
                        let data_path = urlParams.get('data');
        
                        // Reset the cache with the new hits_data
                        localStorage.setItem(`hits_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
                        
                        this.refreshVariables();  // Refresh other variables
                    } catch (error) {
                        alert('Invalid JSON file.');
                    }
                };
            } else {
                alert('Please upload a JSON file.');
            }
        },          
        handle_file_download() {
            let urlParams = new URLSearchParams(window.location.search);
            let data_path = urlParams.get('data');
            let annotator_name = urlParams.get('name')

            // remove .json
            const filename = `${data_path}_${annotator_name}_annotations.json`;
            
            console.log(this.hits_data[this.current_hit_id].annotations)
            const blob = new Blob([JSON.stringify(this.hits_data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
    
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },        
    },
    created: function () {
        let urlParams = new URLSearchParams(window.location.search);
        let data_path = urlParams.get('data');
        let annotator_name = urlParams.get('name')

        // Try loading hits_data from localStorage first
        let cachedData = localStorage.getItem(`hits_data_${data_path}_${annotator_name}`);
        if (cachedData) {
            this.hits_data = JSON.parse(cachedData);
            this.refreshVariables();
            return;
        }

        fetch(`https://raw.githubusercontent.com/Yao-Dou/k-a-ann/main/data/${data_path}/${annotator_name}.json`)
            .then(r => r.json())
            .then(json => {

                // Step 1: Get the keys and convert them to an array
                let keys = Object.keys(json);

                // Step 2: Sort the keys as integers
                keys.sort((a, b) => parseInt(a) - parseInt(b));

                // Step 3: Get the first 50 keys
                let first50Keys = keys.slice(0, 50);

                // Step 4: Create a new JSON object with these 50 keys
                let first50Json = {};
                for (let key of first50Keys) {
                    first50Json[key] = json[key];
                }

                this.hits_data = first50Json;
                
                for (const [i, hit] of Object.entries(this.hits_data)) {
                    if (hit.annotations === undefined) {
                        hit.annotations = {
                            googleQueryAnswer: null,
                            correctedQuery: null,
                            aiEstimation: null,
                            finalEstimation: null,
                            estConfidence: null,
                            referenceLinks: [],
                            briefExplanation: '',
                        }
                    }
                }

                localStorage.setItem(`hits_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
                this.refreshVariables(); // Refresh other variables
            });
    },
    mounted: function () {
    },
    computed: {
        slicedResults() {
          return this.hits_data[this.current_hit_id].search_results.slice(0, this.showCount);
        },
        showMoreButton() {
            return this.hits_data[this.current_hit_id].search_results.length > 4;
        },
        buttonText() {
            return this.allResultsShown ? "Show Less" : "Load More";
        },
        current_hit_id() {
            return this.hits_ids[this.current_hit];
        },
        chatgpt_answer() {
            if (this.hits_data[this.current_hit_id].search_results) {
                let snippet_answer = this.hits_data[this.current_hit_id].snippet_answer
                if ("not_possible" in snippet_answer) {
                    return "No answer found from the snippets."
                } else {
                    if ("answer" in snippet_answer) {
                        return snippet_answer["answer"]
                    } else {
                        return "No answer found from the snippets."
                    }
                }
            } else {
                return this.hits_data[this.current_hit_id].searchable_category
            }
        },
        references() {
            let snippet_answer = this.hits_data[this.current_hit_id].snippet_answer
            if ("reference" in snippet_answer) {
                return snippet_answer["reference"]
            } else {
                return []
            }
        }
    },
})


app.mount('#app')
