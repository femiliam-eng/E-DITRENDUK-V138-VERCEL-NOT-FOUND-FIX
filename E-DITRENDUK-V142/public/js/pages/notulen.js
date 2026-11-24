document.addEventListener('layout:ready', function () {
            pageNotulen();

            document.getElementById('printNote').addEventListener('click', function () {
                window.print();
            });
        });
