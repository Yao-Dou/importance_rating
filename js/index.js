const app = Vue.createApp({
    data() {
        return {
            current_hit: 0,
            hits_data: {},

            bookmarked: false,
            importance: "",
            question: "",
        }
    },
    methods: {
        bookmark_this_hit() {
            if (!this.hits_data[this.current_hit].annotations) {
                this.$set(this.hits_data[this.current_hit], 'annotations', {});
            }
            const isBookmarked = this.hits_data[this.current_hit].annotations.bookmarked || false;
            this.hits_data[this.current_hit].annotations.bookmarked = !isBookmarked;
        },
        cacheAnnotations() {
            // Initialize the annotations dictionary if it doesn't exist
            if (!this.hits_data[this.current_hit].annotations) {
                this.$set(this.hits_data[this.current_hit], 'annotations', {});
            }

            let urlParams = new URLSearchParams(window.location.search);
            let data_path = urlParams.get('data');
            let annotator_name = urlParams.get('name')

            localStorage.setItem(`importance_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
        },
        go_to_hit(hit_num) {
            console.log(this.hits_data[this.current_hit])
            if (hit_num > this.total_hits - 1) {
                hit_num = this.total_hits - 1;
            } else if (hit_num < 0) {
                hit_num = 0;
            }
            this.current_hit = hit_num;

            // Load annotations for the current hit
            const annotations = this.hits_data[this.current_hit].annotations;

            this.bookmarked = annotations.bookmarked || false;
            this.importance = annotations.importance || "";
            this.question = annotations.question || "";
        },
        go_to_hit_circle(hit_num, event) {
            this.go_to_hit(hit_num);
        },
        refreshVariables() {
            this.current_hit = 0;
    
            const annotations = this.hits_data[this.current_hit].annotations || {};
            this.bookmarked = annotations.bookmarked || false;
            this.importance = annotations.importance || "";
            this.question = annotations.question || "";
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
                        localStorage.setItem(`importance_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
                        
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
            const filename = `${data_path}_${annotator_name}_importance_annotations.json`;
            
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
        circleClass(hit_num) {
            const annotations = this.hits_data[hit_num]?.annotations || {};
            let classes = [];
            if (hit_num === this.current_hit) {
                classes.push('black-border');
            }
            if (annotations.bookmarked) {
                classes.push('bg-red');
            } else if (annotations.importance) {
                classes.push('bg-green');
            }
            return classes.join(' ');
        },
    },
    watch: {
        importance: function(newImportance) {
            if (this.hits_data[this.current_hit]?.annotations) {
                this.hits_data[this.current_hit].annotations.importance = newImportance;
            }
        },
        question: function(newQuestion) {
            if (this.hits_data[this.current_hit]?.annotations) {
                this.hits_data[this.current_hit].annotations.question = newQuestion;
            }
        },
        hits_data: {
            deep: true,
            handler() {
                this.cacheAnnotations();
            }
        },
    },
    created: function () {
        let urlParams = new URLSearchParams(window.location.search);
        let data_path = urlParams.get('data');
        let annotator_name = urlParams.get('name')

        // Try loading importance from localStorage first
        let cachedData = localStorage.getItem(`importance_data_${data_path}_${annotator_name}`);
        if (cachedData) {
            this.hits_data = JSON.parse(cachedData);
            this.refreshVariables();
            return;
        }

        fetch(`https://raw.githubusercontent.com/Yao-Dou/importance_rating/main/data/${data_path}/${annotator_name}.json`)
            .then(r => r.json())
            .then(json => {
                this.hits_data = json
                
                for (const hit of this.hits_data) {
                    if (hit.annotations === undefined) {
                        hit.annotations = {
                            bookmarked: false,
                            importance: "",
                            question: "",
                        }
                    }
                }

                localStorage.setItem(`importance_data_${data_path}_${annotator_name}`, JSON.stringify(this.hits_data));
                this.refreshVariables(); // Refresh other variables
            });
    },
    mounted: function () {
    },
    computed: {
        isCurrentHitBookmarked() {
            return this.hits_data[this.current_hit]?.annotations?.bookmarked || false;
        },
        total_hits() {
            return this.hits_data.length;
        },
        type() {
            if (!this.hits_data[this.current_hit]) {
                return 'Loading...'; // or return whatever makes sense in your context
            }
            if (this.hits_data[this.current_hit].type == "title") {
                return "post title"
            } else if (this.hits_data[this.current_hit].type == "post") {
                return "post selftext"
            } else {
                return "comment"
            }
        },
        title() {
            if (!this.hits_data[this.current_hit]) {
                return 'Loading...'; // or return whatever makes sense in your context
            }
            if (this.hits_data[this.current_hit].type == "title") {
                const title = this.hits_data[this.current_hit].title;
                const local_start = this.hits_data[this.current_hit].local_start;
                const local_end = this.hits_data[this.current_hit].local_end;
                return title.slice(0, local_start) + 
                       '<span class="green">' + 
                       title.slice(local_start, local_end) + 
                       '</span>' + 
                       title.slice(local_end);
            } else {
                return this.hits_data[this.current_hit].title;
            }
        },
        post() {
            if (!this.hits_data[this.current_hit]) {
                return 'Loading...'; // or return whatever makes sense in your context
            }
            if (this.hits_data[this.current_hit].type == "post") {
                const post = this.hits_data[this.current_hit].post;
                const local_start = this.hits_data[this.current_hit].local_start;
                const local_end = this.hits_data[this.current_hit].local_end;
                return post.slice(0, local_start) + 
                       '<span class="green">' + 
                       post.slice(local_start, local_end) + 
                       '</span>' + 
                       post.slice(local_end);
            } else {
                if (this.hits_data[this.current_hit].post == "") {
                    return "&lt;empty&gt;";
                }
                return this.hits_data[this.current_hit].post;
            }
        },
        parentComment() {
            if (!this.hits_data[this.current_hit]) {
                return 'Loading...'; // or return whatever makes sense in your context
            }
            return this.hits_data[this.current_hit].parent_comment;
        },
        comment() {
            if (!this.hits_data[this.current_hit]) {
                return 'Loading...'; // or return whatever makes sense in your context
            }
            if (this.hits_data[this.current_hit].type == "comment") {
                const comment = this.hits_data[this.current_hit].comment;
                const local_start = this.hits_data[this.current_hit].local_start;
                const local_end = this.hits_data[this.current_hit].local_end;
                return comment.slice(0, local_start) + 
                       '<span class="green">' + 
                       comment.slice(local_start, local_end) + 
                       '</span>' + 
                       comment.slice(local_end);
            } else {
                return this.hits_data[this.current_hit].comment;
            }
        },
    },
})


app.mount('#app')
