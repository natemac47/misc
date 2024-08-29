(function executeRule(current, previous /*null when async*/) {

    var assetHelper = new AssetUpdateHelper();
    assetHelper.updateAsset(current.variables.asset, current.variables);

})(current, previous);
