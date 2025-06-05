$(document).ready(function () {
    console.debug("Ajax ready");

    $(document).on('submit', "form.ajax", function (e) {
        e.preventDefault();
        console.debug("Form submit triggered");

        const $form = $(this);
        const $btn = $form.find("button[type='submit']");

        if (typeof REST_API_data === 'undefined' || !REST_API_data.ajax || !REST_API_data.nonce) {
            show_mess('Configuration error. Please reload the page.', 'error');
            return;
        }

        const formData = new FormData($form[0]);
        formData.append('security', REST_API_data.nonce);
        $btn.prop('disabled', true);

        $.ajax({
            url: REST_API_data.ajax,
            type: 'POST',
            data: formData,
            dataType: 'json',
            processData: false,
            contentType: false,
            cache: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', REST_API_data.nonce);
                console.debug("AJAX request sent");
                $btn.prop('disabled', true);
            },
            success: function (response) {
                $btn.prop('disabled', true);
                console.debug("AJAX success", response);
                if (response.success) {
                    handleAjaxResponse(response.data);
                } else {
                    show_mess(response.data?.message || 'Error processing request.', 'error');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', true);
                console.error("AJAX error", xhr);

                // Обробка статусів помилок
                switch (xhr.status) {
                    case 400:
                        show_mess('Bad Request: ' + (xhr.responseJSON?.data?.message || 'Invalid request.'), 'error');
                        break;
                    case 401:
                        show_mess('Unauthorized: ' + (xhr.responseJSON?.data?.message || 'Invalid credentials.'), 'error');
                        break;
                    case 403:
                        show_mess('Forbidden: Access denied.', 'error');
                        break;
                    case 404:
                        show_mess('Not Found: The requested resource could not be found.', 'error');
                        break;
                    case 500:
                        show_mess('Internal Server Error. Please try again later.', 'error');
                        break;
                    default:
                        show_mess('Error: ' + xhr.statusText, 'error');
                        break;
                }
            },
            complete: function () {
                console.debug("AJAX complete");
                $btn.prop('disabled', false);
            }
        });

        return false;
    });
});

// Обробка відповіді сервера
function handleAjaxResponse(data) {
    switch (data.action) {
        case 'reload':
            location.reload();
            break;
        case 'alert':
        case 'mess':
            show_mess(data.message);
            break;
        case 'redirect':
            window.location.href = data.url;
            break;
        case 'append':
            $(data.selector).html($(data.selector).html() + data.html);
            break;
        case 'update':
            $(data.selector).html(data.html);
            break;
        default:
            console.log(data);
            break;
    }
}

// Функція показу повідомлень (поверх усіх вікон)
function show_mess(text, type = 'info') {
    const $messageContainer = $('<div class="ajax-message"></div>').text(text);

    switch (type) {
        case 'error':
            $messageContainer.css({
                backgroundColor: '#f44336',
                color: '#fff'
            });
            break;
        case 'success':
            $messageContainer.css({
                backgroundColor: '#4caf50',
                color: '#fff'
            });
            break;
        default:
            $messageContainer.css({
                backgroundColor: '#2196f3',
                color: '#fff'
            });
            break;
    }

    // Стиль для повідомлення поверх всіх вікон
    $messageContainer.css({
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '15px 30px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
    });

    // Додавання повідомлення на сторінку
    $('body').append($messageContainer);

    // Автоматичне приховання повідомлення через 5 секунд
    setTimeout(function () {
        $messageContainer.fadeOut(300, function () {
            $(this).remove();
        });
    }, 5000);
}
