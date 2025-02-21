//Add sys_property named in line 8
//Can retrofit code for catalog or catalog + knowledge

var RelevantForYouUtil = Class.create();
RelevantForYouUtil.prototype = Object.extendsObject(RelevantForYouUtilSNC, {

    _getFilteredSysIds: function() {
        var filteredSysIdsStr = gs.getProperty('sn_hr_sp.relevant_for_you.filtered_knowledge_articles', '');
        var filteredSysIds = [];
        if (filteredSysIdsStr) {
            filteredSysIds = filteredSysIdsStr.split(',').map(function(id) {
                return id.trim();
            });
        }
        return filteredSysIds;
    },

    _getArticlesWithReplacement: function(fetcherFunc, articleCount, filteredSysIds) {
        var finalArticles = [];
        var currentIgnore = [];
        var maxAttempts = 3; 
        for (var attempt = 0; attempt < maxAttempts; attempt++) {
            var missing = articleCount - finalArticles.length;
            if (missing <= 0) break;
            var articles = fetcherFunc(missing, currentIgnore);
            if (!articles || articles.length === 0) break;
            var validArticles = articles.filter(function(article) {
                return filteredSysIds.indexOf(article.sys_id) === -1;
            });
            finalArticles = finalArticles.concat(validArticles);
            var returnedSysIds = articles.map(function(article) { return article.sys_id; });
            currentIgnore = currentIgnore.concat(returnedSysIds);
            if (finalArticles.length >= articleCount) break;
        }
        return finalArticles.slice(0, articleCount);
    },

    getMostViewedArticles: function(knowledgeBases, kbRecords, articleCount, ignoreArticles, taxonomyId) {
        var filteredSysIds = this._getFilteredSysIds();
        var fetcher = function(count, ignoreList) {
            var mergedIgnore = (ignoreArticles || []).concat(ignoreList || []);
            return this.userRecommendationUtil.getMostViewedArticles({
                knowledgeBases: knowledgeBases,
                kbRecords: kbRecords,
                articleCount: count,
                ignoreArticles: mergedIgnore,
                taxonomyId: taxonomyId
            });
        }.bind(this);
        return this._getArticlesWithReplacement(fetcher, articleCount, filteredSysIds);
    },

    getSimilarUserArticles: function(users, knowledgeBases, displayCount, recentActivityCutoffDate, taxonomyId) {
        var filteredSysIds = this._getFilteredSysIds();
        var fetcher = function(count, ignoreList) {
            return this.userRecommendationUtil.getArticlesforSimilarUsers({
                users: users,
                knowledgeBases: knowledgeBases,
                articleCount: count,
                recentActivityCutoffDate: recentActivityCutoffDate,
                taxonomyId: taxonomyId,
                ignoreArticles: ignoreList  
            });
        }.bind(this);
        return this._getArticlesWithReplacement(fetcher, displayCount, filteredSysIds);
    },


    getCombinedData: function(articleResults, catalogResults, displayCount) {
        var combinedData = this.userRecommendationUtil.getNormalizedData({
            articleResults: articleResults,
            catalogResults: catalogResults
        }, displayCount, true);
        var filteredSysIds = this._getFilteredSysIds();
        if (combinedData && combinedData.articleResults) {
            combinedData.articleResults = combinedData.articleResults.filter(function(article) {
                return filteredSysIds.indexOf(article.sys_id) === -1;
            });
        }
        return combinedData;
    },

    type: 'RelevantForYouUtil'
});
