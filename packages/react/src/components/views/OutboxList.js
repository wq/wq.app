import React from 'react';
import { useRenderContext, useReverse, useComponents } from '../../hooks';

const SUCCESS = '\u2713',
    ERROR = '\u2717',
    PENDING = '?';

export default function OutboxList() {
    const reverse = useReverse(),
        { list } = useRenderContext(),
        { Link } = useComponents();

    if (!list || !list.length) {
        return (
            <div>
                <p>No items in outbox.</p>
            </div>
        );
    }
    return (
        <div>
            <ul>
                {list.map(item => (
                    <li key={item.id}>
                        <Link to={reverse('outbox_detail', item.id)}>
                            {item.synced
                                ? SUCCESS
                                : item.error
                                ? ERROR
                                : PENDING}
                            {item.modelConf && `${item.modelConf.name}: `}
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
