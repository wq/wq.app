define(['./lib/jquery'], function($) {
    var photos = {};
    photos.preview = function(imgid, file, fallback) {
        if (window.FileReader) {
            var reader = new FileReader();
            reader.onload = function(evt) {
                $('#'+imgid).attr('src', evt.target.result);
            }
            reader.readAsDataURL(file);
        } else if (fallback) {
            $('#'+imgid).attr('src', fallback);
        }
    };
    return photos;
});
