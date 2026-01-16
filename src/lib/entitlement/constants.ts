export const KEYS = {
    core: {
        agency: {
            account: {
                create: 'core.agency.account.create',
                read: 'core.agency.account.read',
                update: 'core.agency.account.update',
                delete: 'core.agency.account.delete',
            },
        },
        subaccounts: {
            account: {
                create: 'core.subaccounts.account.create',
                read: 'core.subaccounts.account.read',
                update: 'core.subaccounts.account.update',
                delete: 'core.subaccounts.account.delete',
            },
            user: {
                create: 'core.subaccounts.user.create',
                read: 'core.subaccounts.user.read',
                update: 'core.subaccounts.user.update',
                delete: 'core.subaccounts.user.delete',
            },
            media: {
                upload: 'core.subaccounts.media.upload',
                delete: 'core.subaccounts.media.delete',
            },
        },
    },
    crm: {
        pipelines: {
            pipeline: {
                create: 'crm.pipelines.pipeline.create',
                read: 'crm.pipelines.pipeline.read',
                update: 'crm.pipelines.pipeline.update',
                delete: 'crm.pipelines.pipeline.delete',
            },
            lane: {
                create: 'crm.pipelines.lane.create',
                read: 'crm.pipelines.lane.read',
                update: 'crm.pipelines.lane.update',
                delete: 'crm.pipelines.lane.delete',
            },
            ticket: {
                create: 'crm.pipelines.ticket.create',
                read: 'crm.pipelines.ticket.read',
                update: 'crm.pipelines.ticket.update',
                delete: 'crm.pipelines.ticket.delete',
            },
            tag: {
                create: 'crm.pipelines.tag.create',
                read: 'crm.pipelines.tag.read',
                update: 'crm.pipelines.tag.update',
                delete: 'crm.pipelines.tag.delete',
            },
        },
        contacts: {
            contact: {
                create: 'crm.contacts.contact.create',
                read: 'crm.contacts.contact.read',
                update: 'crm.contacts.contact.update',
                delete: 'crm.contacts.contact.delete',
            },
        },
        funnels: {
            funnel: {
                create: 'crm.funnels.funnel.create',
                read: 'crm.funnels.funnel.read',
                update: 'crm.funnels.funnel.update',
                delete: 'crm.funnels.funnel.delete',
            },
        },
        billing: {
            rebilling: {
                enable: 'crm.billing.rebilling.enable',
                disable: 'crm.billing.rebilling.disable',
            },
        },
    },
} as const;
