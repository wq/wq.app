/*
FIXME

function _makeCluster(clusterIcon) {
    return function clusterDiv(cluster) {
        var cls;
        var context = {
            count: cluster.getChildCount()
        };
        if (context.count >= 100) {
            context.large = true;
        } else if (context.count >= 10) {
            context.medium = true;
        } else {
            context.small = true;
        }
        if (typeof clusterIcon == 'function') {
            cls = clusterIcon(context);
        } else if (clusterIcon.indexOf('{{') > -1) {
            cls = tmpl.render(clusterIcon, context);
        } else {
            cls = clusterIcon;
        }
        var html = tmpl.render('<div><span>{{count}}</span></div>', context);
        return new L.DivIcon({
            html: html,
            className: 'marker-cluster ' + cls,
            iconSize: new L.Point(40, 40)
        });
    };
}
*/
