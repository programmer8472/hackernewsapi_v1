$(function () {
    $("#button-search").prop("disabled", true).css('opacity', 0.5);
    
    
    $("#button-search").click(function (event) {
        event.preventDefault()
        var searchText = $("#text-search").val();
        if (searchText == '') loadFromCache();
        // iterate through the in-memory result set adding to the search result array then build from that array
        searchResult = [];
        $('ul').empty();
        var cachedData = localStorage['articleDetail'].split('|');
        var noResults = true;
        cachedData.forEach(function (element) {
            if (element == null || element == '') return;
            var jsonData = JSON.parse(element);
            if (jsonData['title'].toLowerCase().includes(searchText)
                || jsonData['by'].toLowerCase().includes(searchText)) {

                $('ul').append(getArticleMarkup(jsonData));
                noResults = false;
            }

        });
        if (noResults) {
            $('ul').append("<li class='no-results'>No results to display</li>");
        }

    });

    //make tha AJAX call to get a list of new article IDs
    $.ajax({
        url: '/HackerNews',
        type: 'GET',
        dataType: 'text',
        contentType: "application/json; charset=utf-8",  
        async: false,
        success: function (data, textStatus, xhr) {

            if (!data.includes('Server error')) {
                // Check if there's been a change in the articles list, if so, rebuild from new list
                if (localStorage['latestArticleIds'] != data) {
                    localStorage['articleDetail'] = ''; // clear cache after getting fresh data
                    var resultsArray = data.split(",");
                    resultsArray.forEach(function (element) {
                        getArticleDetail(element);
                    });
                    localStorage['latestArticleIds'] = data;

                    //Only now can the Search button be enabled.
                    setTimeout(function () { $("#button-search").prop("disabled", false).css('opacity', 1); }, 13000);

                }
                else { // Otherwise use the cached data from Session

                    loadFromCache();
                    $("#button-search").prop("disabled", false).css('opacity', 1);;
                }
            }
            else {
                $('ul').append('<li class="server-error">Server error. Please try again later.</li>');
            }
            
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log('Error in Operation');
        }

    });
    
    $("#text-search").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#button-search").click();
        }
    });
    
});

function getArticleDetail(id) {
    $.ajax({
        url: '/HackerNews/GetArticleDetail',
        type: 'GET',
        dataType: 'text',
        contentType: "application/json; charset=utf-8",
        async: true,
        data: { 'id': id },
        success: function (data, textStatus, xhr) {
            if (!data.includes('Server error')) {
                console.log('Detailed looked up for ' + data);
                var jsonData = JSON.parse(data);
                //$('ul').append('<li>' + jsonData['title'] + '</li>');
                $('ul').append(getArticleMarkup(jsonData));
                // Add to in memory array which will represent the cached list plus used in the Search
                var articleDetail = { url: jsonData['url'], title: jsonData['title'], by: jsonData['by'] };
                localStorage['articleDetail'] += JSON.stringify(articleDetail) + '|';
            }
            else {
                $('ul').append('<li class="server-error">Server error. Please try again later.</li>');
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log('Error in Detail Operation');
        }

    });
}

function getArticleMarkup(jsonData) {
    return "<li><a href="
        + jsonData['url']
        + " target='_blank'><p><span class='title'>"
        + jsonData['title'] + "</span><br /><span class='author'>"
        + jsonData['by']
        + "</span></p></a></li>";
}

function loadFromCache() {
    var cachedData = localStorage['articleDetail'].split('|');
    cachedData.forEach(function (element) {
        if (element == null || element == '') return;
        var jsonData = JSON.parse(element);
        $('ul').append(getArticleMarkup(jsonData));
    });
}